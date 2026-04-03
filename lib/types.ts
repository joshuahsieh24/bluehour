export type SceneId =
  | "rainy-cafe"
  | "midnight-jazz"
  | "piano-room"
  | "night-library"
  | "city-window"
  | "silent-study";

export type AnimationPreset =
  | "rain"
  | "haze"
  | "dust"
  | "still"
  | "rain-city";

export type OverlayMode = "focus" | "minimal" | "ambient";

export type SessionMode =
  | "deep work"
  | "writing"
  | "reading"
  | "coding"
  | "reflection";

export type SessionDuration = 25 | 50 | "untimed";

export type FocusState =
  | "pre-session"
  | "active"
  | "paused"
  | "interrupted"
  | "complete";

export interface Scene {
  id: SceneId;
  name: string;
  description: string;
  gradient: string;          // CSS gradient fallback (always shown)
  imageSrc?: string;         // optional real image path
  accent: string;            // hex accent color
  audioSrc?: string;         // path to ambient audio
  animationPreset: AnimationPreset;
  grainOpacity: number;      // 0–1
  vignetteStrength: "normal" | "strong";
  hazeColor?: string;        // for haze overlay
  hazeOpacity?: number;
}

export interface SessionRecord {
  id: string;
  startedAt: number;         // timestamp ms
  endedAt: number;           // timestamp ms
  duration: number;          // seconds elapsed
  plannedDuration: SessionDuration;
  mode: SessionMode;
  task: string;
  sceneId: SceneId;
  completed: "yes" | "partly" | "no";
  pulledAway?: string;
  interruptions: number;
}

export interface ActiveSession {
  id: string;
  startedAt: number;
  pausedAt?: number;
  totalPausedMs: number;
  plannedDuration: SessionDuration;
  mode: SessionMode;
  task: string;
  sceneId: SceneId;
  interruptions: number;
}

export interface AppPreferences {
  lastSceneId: SceneId;
  lastDuration: SessionDuration;
  lastMode: SessionMode;
  muted: boolean;
  overlayMode: OverlayMode;
  volume: number;
}
