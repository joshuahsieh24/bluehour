/**
 * Session sound cues — soft, calm, non-alarmy.
 *
 * Two hooks:
 *   playCountdownCue()   — fires once at the 3-second mark before a session ends.
 *                          Programmatic Web Audio sine wave — no file dependency.
 *                          Gentle signal that the session is nearly done.
 *
 *   playCompletionChime() — fires when the session reaches zero.
 *                           Currently a placeholder; swap in a curated audio file
 *                           by uncommenting the Audio block below.
 *
 * Design rules for any replacement sounds:
 *   - Short (≤3s), low amplitude (≤0.3), non-percussive attack
 *   - No buzzers, alarms, or kitchen-timer cadence
 *   - The goal is a calm signal, not a productivity alarm
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_ctx || _ctx.state === "closed") {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      _ctx = new Ctor();
    }
    // Resume if suspended by browser autoplay policy (user has already interacted)
    if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Soft single-tone cue — plays once at 3 seconds remaining.
 * 432Hz sine wave, 0.07 peak amplitude, 1.6s exponential fade.
 * Designed to feel like a breath, not a beep.
 */
export function playCountdownCue(): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(432, ctx.currentTime);

    // Soft attack, long exponential release — sounds like a distant bell
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.8);
  } catch {/* ignore */}
}

/**
 * Completion chime — fires when the session reaches zero.
 * Currently a silent placeholder; curate and enable when ready.
 *
 * To enable: drop /public/audio/complete.mp3 and uncomment below.
 * Keep the file short (≤3s), soft (mix low), and gentle in character.
 */
export function playCompletionChime(): void {
  // try {
  //   const audio = new Audio("/audio/complete.mp3");
  //   audio.volume = 0.28;
  //   audio.play().catch(() => {});
  // } catch {/* ignore */}
}
