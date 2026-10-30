/**
 * Audio engine — the single owner of every sound bluehour makes.
 *
 * Why one module instead of per-component players:
 *
 *   Browsers only let media start inside a user gesture, and Safari tracks that
 *   permission *per element*. Creating a fresh <audio> (or a fresh Howl) after
 *   a React effect, a dynamic import, or a 25-minute timer therefore fails
 *   intermittently. The fix is architectural: a fixed set of elements created
 *   once, "unlocked" synchronously inside the first gesture (played at volume
 *   0 with a tiny silent clip or the real source), and reused forever by
 *   swapping `src`. Everything the UI does is expressed as *intent*
 *   (setAmbient / setPlaying / setVolume / setMuted) and the engine reconciles.
 *
 * Elements:
 *   - players[0..1] — ambient loops, A/B so scene switches crossfade
 *   - chime         — end-of-session chime, preloaded at session start so it
 *                     plays from cache minutes later without a network hit
 *   - AudioContext  — the synthesized 3-second countdown cue
 *
 * SSR-safe: every public method is a no-op without `window`.
 */

export interface AudioEngineState {
  /** play() was refused by the autoplay policy; a user gesture is required. */
  blocked: boolean;
  /** Every element has been unlocked by a gesture and can be driven freely. */
  unlocked: boolean;
}

type Listener = (state: AudioEngineState) => void;

const AMBIENT_FADE_IN_MS = 1500;
const AMBIENT_FADE_OUT_MS = 700;
const CROSSFADE_MS = 1200;
const VOLUME_FADE_MS = 400;
const CHIME_DELAY_MS = 400;
const CHIME_MAX_VOLUME = 0.3;
const MAX_LOAD_RETRIES = 2;

// Capture-phase listeners on these events give us the gesture before React's
// handlers run, so play() is inside the activation window on every browser.
const GESTURE_EVENTS = ["pointerdown", "pointerup", "touchend", "keydown", "click"] as const;

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
const noop = () => {};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 50ms of 8kHz silence — used to unlock elements that have no source yet. */
let silentUri: string | null = null;
function silentWavUri(): string {
  if (silentUri) return silentUri;
  const sampleRate = 8000;
  const samples = 400;
  const buf = new ArrayBuffer(44 + samples * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + samples * 2, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, samples * 2, true);
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  silentUri = `data:audio/wav;base64,${btoa(bin)}`;
  return silentUri;
}

interface Fade {
  id: number;
  resolve: (completed: boolean) => void;
}

class AudioEngine {
  private booted = false;
  private players: HTMLAudioElement[] = [];
  private chimeEl: HTMLAudioElement | null = null;
  private activeIdx = 0;
  private ctx: AudioContext | null = null;

  // Intent
  private src: string | null = null;
  private fallbackSrc: string | null = null;
  private chimeSrc: string | null = null;
  private chimeFallbackSrc: string | null = null;
  /** Set once a fallback origin has had to be used; later loads skip the CDN. */
  private preferFallback = false;
  private shouldPlay = false;
  private volume = 0.6;
  private muted = false;

  // Bookkeeping
  private unlockedEls = new WeakSet<HTMLAudioElement>();
  private fades = new Map<HTMLAudioElement, Fade>();
  private retries = new Map<string, number>();
  private retryTimer: number | null = null;
  private chimeTimer: number | null = null;
  private listeners = new Set<Listener>();
  private state: AudioEngineState = { blocked: false, unlocked: false };

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  private boot(): boolean {
    if (!isBrowser) return false;
    if (this.booted) return true;
    this.booted = true;
    this.players = [this.createElement("ambient-a", true), this.createElement("ambient-b", true)];
    this.chimeEl = this.createElement("chime", false);
    document.addEventListener("visibilitychange", this.onVisibility);
    for (const ev of GESTURE_EVENTS) {
      window.addEventListener(ev, this.onGesture, { capture: true, passive: true });
    }
    return true;
  }

  private createElement(name: string, loop: boolean): HTMLAudioElement {
    const el = document.createElement("audio");
    el.preload = "auto";
    el.loop = loop;
    el.volume = 0;
    el.setAttribute("playsinline", "");
    el.setAttribute("data-bh-audio", name);
    el.style.display = "none";
    el.addEventListener("error", () => this.onError(el));
    // Some engines fire `ended` on a looping element after a stall; keep the loop alive.
    el.addEventListener("ended", () => {
      if (loop && el === this.current && this.shouldPlay) this.safePlay(el);
    });
    document.body.appendChild(el);
    return el;
  }

  private get current(): HTMLAudioElement { return this.players[this.activeIdx]; }
  private get idle(): HTMLAudioElement { return this.players[1 - this.activeIdx]; }
  private effectiveVolume(): number { return this.muted ? 0 : clamp01(this.volume); }

  // ─── Gesture unlock ─────────────────────────────────────────────────────────

  private onGesture = () => { this.unlock(); };

  /**
   * Unlock every element. Safe to call on every gesture; it is a no-op once
   * everything is unlocked. Must run synchronously inside the event handler.
   */
  unlock(): void {
    if (!this.boot()) return;

    const ctx = this.getCtx();
    if (ctx && ctx.state === "suspended") ctx.resume().catch(noop);

    for (const el of [...this.players, this.chimeEl!]) {
      if (this.unlockedEls.has(el)) continue;
      const isActive = el === this.current;
      const usedSilence = !el.getAttribute("src");
      if (usedSilence) el.src = silentWavUri();

      let p: Promise<void> | undefined;
      try { p = el.play(); } catch { continue; }
      if (!p) continue;

      p.then(() => {
        this.unlockedEls.add(el);
        this.updateUnlocked();
        if (isActive && this.shouldPlay && this.src) {
          this.setBlocked(false);
          this.fadeTo(el, this.effectiveVolume(), AMBIENT_FADE_IN_MS);
          return;
        }
        el.pause();
        if (usedSilence) {
          el.removeAttribute("src");
          el.load();
        } else {
          try { el.currentTime = 0; } catch { /* not seekable yet */ }
        }
      }).catch(noop); // Not inside a real activation — the next gesture retries.
    }
  }

  // ─── Public intent API ──────────────────────────────────────────────────────

  /**
   * Switch the ambient source (crossfades if currently playing).
   * `fallbackSrc` is tried if `src` fails to load — e.g. the same file on the
   * app's own origin when the CDN is unreachable.
   */
  setAmbient(src: string | null, fallbackSrc: string | null = null): void {
    if (!this.boot()) return;
    if (src === this.src) {
      this.fallbackSrc = fallbackSrc;
      return;
    }
    this.src = src;
    this.fallbackSrc = fallbackSrc;
    this.clearRetry();

    const old = this.current;
    this.activeIdx = 1 - this.activeIdx;
    const next = this.current;

    if (old.getAttribute("src") && !old.paused) {
      this.fadeTo(old, 0, CROSSFADE_MS).then((done) => { if (done) this.release(old); });
    } else {
      this.release(old);
    }

    if (!src) return;
    next.volume = 0;
    // Assigning src starts preload="auto" buffering immediately.
    next.src = this.preferFallback && fallbackSrc ? fallbackSrc : src;
    if (this.shouldPlay) this.start(next);
  }

  /** Whether the ambient loop should be audible (session active). */
  setPlaying(playing: boolean): void {
    if (!this.boot()) return;
    if (playing === this.shouldPlay) return;
    this.shouldPlay = playing;
    const el = this.current;
    if (!this.src) return;
    if (playing) {
      this.start(el);
    } else {
      this.fadeTo(el, 0, AMBIENT_FADE_OUT_MS).then((done) => {
        if (done && !this.shouldPlay) el.pause();
      });
    }
  }

  setVolume(volume: number): void {
    if (!this.boot()) return;
    this.volume = clamp01(volume);
    if (this.shouldPlay && !this.current.paused) {
      this.fadeTo(this.current, this.effectiveVolume(), VOLUME_FADE_MS);
    }
  }

  /** Mute keeps the element playing at volume 0 so unmute never needs play(). */
  setMuted(muted: boolean): void {
    if (!this.boot()) return;
    if (muted === this.muted) return;
    this.muted = muted;
    if (this.shouldPlay && !this.current.paused) {
      this.fadeTo(this.current, this.effectiveVolume(), muted ? 500 : 800);
    }
  }

  /** Point the chime element at its file so it is cached before it is needed. */
  preloadChime(src: string, fallbackSrc: string | null = null): void {
    if (!this.boot() || !this.chimeEl) return;
    this.chimeFallbackSrc = fallbackSrc;
    if (this.chimeSrc === src) return;
    this.chimeSrc = src;
    this.chimeEl.src = this.preferFallback && fallbackSrc ? fallbackSrc : src;
  }

  /**
   * End-of-session chime. Delayed so it lands as the ambient fade-out begins
   * rather than colliding with it. Volume is relative to the user's setting
   * and capped so it never overwhelms the scene.
   */
  playChime(volume: number): void {
    if (!this.boot()) return;
    this.cancelChime();
    const el = this.chimeEl;
    if (!el || !this.chimeSrc) return;
    this.chimeTimer = window.setTimeout(() => {
      this.chimeTimer = null;
      el.volume = Math.min(clamp01(volume) * 0.55, CHIME_MAX_VOLUME);
      try { el.currentTime = 0; } catch { /* not seekable */ }
      el.play().catch(noop);
    }, CHIME_DELAY_MS);
  }

  cancelChime(): void {
    if (this.chimeTimer !== null) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
  }

  /**
   * Soft 3-second pre-completion cue: 432Hz sine, 0.07 peak, 1.8s exponential
   * fade. A breath, not a beep.
   */
  playCue(): void {
    if (!this.boot()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const fire = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.8);
      } catch { /* ignore */ }
    };
    if (ctx.state === "running") fire();
    else ctx.resume().then(fire).catch(noop);
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  getState = (): AudioEngineState => this.state;

  // ─── Internals ──────────────────────────────────────────────────────────────

  private start(el: HTMLAudioElement): void {
    if (!el.getAttribute("src")) return;
    this.safePlay(el).then((ok) => {
      if (ok) this.fadeTo(el, this.effectiveVolume(), AMBIENT_FADE_IN_MS);
    });
  }

  private safePlay(el: HTMLAudioElement): Promise<boolean> {
    let p: Promise<void> | undefined;
    try { p = el.play(); } catch (err) { p = Promise.reject(err); }
    return (p ?? Promise.resolve()).then(
      () => {
        this.unlockedEls.add(el);
        this.updateUnlocked();
        this.setBlocked(false);
        return true;
      },
      (err: unknown) => {
        // NotAllowedError = autoplay policy. AbortError = we paused/loaded mid-play
        // (benign). NotSupportedError = bad source, handled by the error listener.
        if (err instanceof DOMException && err.name === "NotAllowedError") this.setBlocked(true);
        return false;
      }
    );
  }

  private release(el: HTMLAudioElement): void {
    this.cancelFade(el);
    el.pause();
    el.volume = 0;
    if (el.getAttribute("src")) {
      el.removeAttribute("src");
      el.load(); // aborts any in-flight download
    }
  }

  private fadeTo(el: HTMLAudioElement, target: number, ms: number): Promise<boolean> {
    this.cancelFade(el);
    const from = el.volume;
    if (ms <= 0 || Math.abs(from - target) < 0.005) {
      el.volume = target;
      return Promise.resolve(true);
    }
    const startedAt = performance.now();
    return new Promise<boolean>((resolve) => {
      // Timer-based (not rAF) so fades complete even in a hidden tab, where the
      // interval is throttled and simply jumps to the end.
      const id = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - startedAt) / ms);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        el.volume = from + (target - from) * eased;
        if (t >= 1) {
          clearInterval(id);
          this.fades.delete(el);
          resolve(true);
        }
      }, 32);
      this.fades.set(el, { id, resolve });
    });
  }

  private cancelFade(el: HTMLAudioElement): void {
    const fade = this.fades.get(el);
    if (!fade) return;
    clearInterval(fade.id);
    this.fades.delete(el);
    fade.resolve(false);
  }

  private onError(el: HTMLAudioElement): void {
    const code = el.error?.code;
    if (code === undefined || code === MediaError.MEDIA_ERR_ABORTED) return;

    // Chime: one-shot swap to the fallback origin.
    if (el === this.chimeEl) {
      if (this.chimeFallbackSrc && el.getAttribute("src") !== this.chimeFallbackSrc) {
        this.preferFallback = true;
        el.src = this.chimeFallbackSrc;
      }
      return;
    }

    if (el !== this.current || !this.src) return;
    const src = this.src;

    // A DNS failure or 404 on the CDN is deterministic — go straight to the
    // fallback origin and keep using it for every later load this page.
    if (this.fallbackSrc && el.getAttribute("src") !== this.fallbackSrc) {
      this.preferFallback = true;
      el.src = this.fallbackSrc;
      if (this.shouldPlay) this.start(el);
      return;
    }

    // Anything else (transient network) retries the same URL with backoff.
    const attempt = this.retries.get(src) ?? 0;
    if (attempt >= MAX_LOAD_RETRIES) return;
    this.retries.set(src, attempt + 1);
    this.clearRetry();
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      if (el !== this.current || this.src !== src) return;
      el.src = el.getAttribute("src") ?? src;
      if (this.shouldPlay) this.start(el);
    }, 2500 * (attempt + 1));
  }

  private clearRetry(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // Resume after OS-level interruptions (calls, Bluetooth handoff, iOS tab
  // suspension) when the page becomes visible again.
  private onVisibility = () => {
    if (document.visibilityState !== "visible") return;
    const el = this.current;
    if (this.shouldPlay && this.src && el.paused) this.start(el);
  };

  private getCtx(): AudioContext | null {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      if (!this.ctx || this.ctx.state === "closed") this.ctx = new Ctor();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private setBlocked(blocked: boolean): void {
    if (this.state.blocked === blocked) return;
    this.state = { ...this.state, blocked };
    this.emit();
  }

  private updateUnlocked(): void {
    const unlocked =
      this.players.every((p) => this.unlockedEls.has(p)) &&
      (!this.chimeEl || this.unlockedEls.has(this.chimeEl));
    if (unlocked === this.state.unlocked) return;
    this.state = { ...this.state, unlocked };
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((l) => l(this.state));
  }
}

export const audioEngine = new AudioEngine();
