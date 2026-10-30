"use client";

import { useEffect, useSyncExternalStore } from "react";
import { audioEngine, type AudioEngineState } from "./audioEngine";

interface AmbientIntent {
  /** Ambient loop URL for the current scene, or null for a silent scene. */
  src: string | null;
  /** Same-origin copy tried if `src` fails to load (CDN outage). */
  fallbackSrc?: string | null;
  /** True only while the session is actively running. */
  playing: boolean;
  muted: boolean;
  volume: number;
}

/**
 * Pushes the UI's intent into the audio engine. The engine owns the elements
 * and their lifecycle; this hook never creates or destroys anything, so React
 * re-renders, Strict Mode double-effects and route changes cannot leak or
 * duplicate players.
 */
export function useAmbientAudio({ src, fallbackSrc = null, playing, muted, volume }: AmbientIntent): void {
  // Order matters on first mount: source before play intent.
  useEffect(() => { audioEngine.setAmbient(src, fallbackSrc); }, [src, fallbackSrc]);
  useEffect(() => { audioEngine.setVolume(volume); }, [volume]);
  useEffect(() => { audioEngine.setMuted(muted); }, [muted]);
  useEffect(() => { audioEngine.setPlaying(playing); }, [playing]);
  // Leaving the page (e.g. to /history) stops the loop.
  useEffect(() => () => { audioEngine.setPlaying(false); }, []);
}

const SERVER_STATE: AudioEngineState = { blocked: false, unlocked: false };

export function useAudioEngineState(): AudioEngineState {
  return useSyncExternalStore(audioEngine.subscribe, audioEngine.getState, () => SERVER_STATE);
}
