/**
 * Completion chime hook — plays a soft sound when a focus session ends.
 *
 * This is a structured placeholder. To add a real chime:
 *   1. Drop an audio file at /public/audio/complete.mp3 (or .ogg)
 *   2. Uncomment the Audio approach below, or use Howler if already loaded.
 *
 * Keep any replacement sound short (≤3s), gentle, and non-percussive.
 * This is not a kitchen timer — it should feel like a soft signal, not an alarm.
 */
export function playCompletionChime(): void {
  // Placeholder — no sound until a curated chime is selected.
  // Uncomment to enable once /public/audio/complete.mp3 is ready:
  //
  // try {
  //   const audio = new Audio("/audio/complete.mp3");
  //   audio.volume = 0.35;
  //   audio.play().catch(() => {});
  // } catch {/* ignore */}
}
