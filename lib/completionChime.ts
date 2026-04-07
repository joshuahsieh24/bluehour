/**
 * Session sound cues — soft, calm, non-alarmy.
 *
 * Two hooks:
 *   playCountdownCue(muted?)    — single soft tone at 3s remaining.
 *                                 Web Audio API — no file dependency.
 *
 *   playCompletionChime(v, m)   — plays chimeending.mp3 when the session ends.
 *                                 Scales with the user's volume setting.
 *                                 Fires ~400ms after completion so it lands
 *                                 as the ambient audio begins its fade-out,
 *                                 rather than competing directly with it.
 *
 * Design rules for this module:
 *   - No alarms, buzzers, or percussive attack
 *   - Volume is conservative — these are signals, not notifications
 *   - muted === true → complete silence, no exceptions
 */

// Audio served from GitHub CDN — same pattern as ambient scene audio.
// All audio is excluded from Vercel build output via .vercelignore.
const AUDIO_CDN =
  "https://raw.githubusercontent.com/joshuahsieh24/bluehour/main/public/audio";

// Shared AudioContext — lazily created, reused across calls
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!_ctx || _ctx.state === "closed") _ctx = new Ctor();
    if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Soft 3-second pre-completion cue.
 *
 * 432Hz sine wave, 0.07 peak amplitude, 1.8s exponential fade.
 * Designed to feel like a distant, barely-there bell — a breath, not a beep.
 * Fires once per session at remaining === 3s.
 */
export function playCountdownCue(muted = false): void {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
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
  } catch {/* ignore */}
}

/**
 * End-of-session chime — plays when the timer reaches zero.
 *
 * Uses chimeending.mp3 served from the GitHub audio CDN.
 * Volume is scaled relative to the user's ambient volume setting and capped
 * at 0.30 so the chime never overwhelms the scene — it arrives gently as
 * the ambient audio fades out, not over it.
 *
 * A 400ms delay is intentional: it lets the ambient fade start first so
 * the chime feels like arrival rather than collision.
 *
 * @param volume  User's current volume (0–1), default 0.6
 * @param muted   If true, no sound plays at all
 */
// Pending chime timeout — stored so it can be cancelled if End is pressed
// before the 400ms delay fires.
let _chimeTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Cancel any pending completion chime that hasn't fired yet.
 * Call this whenever the session is ended manually so the chime
 * doesn't land after an intentional End action.
 */
export function cancelCompletionChime(): void {
  if (_chimeTimeout !== null) {
    clearTimeout(_chimeTimeout);
    _chimeTimeout = null;
  }
}

export function playCompletionChime(volume = 0.6, muted = false): void {
  if (muted) return;
  const targetVolume = Math.min(volume * 0.55, 0.30);
  _chimeTimeout = setTimeout(() => {
    _chimeTimeout = null;
    try {
      const audio = new Audio(`${AUDIO_CDN}/chimeending.mp3`);
      audio.volume = targetVolume;
      audio.play().catch(() => {});
    } catch {/* ignore */}
  }, 400);
}
