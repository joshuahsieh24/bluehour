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

// Any positive number of minutes, or open-ended
export type SessionDuration = number | "untimed";

export type FocusState =
  | "pre-session"
  | "active"
  | "paused"
  | "interrupted"
  | "complete";

export interface Scene {
  id: SceneId;
  name: string;
  description: string;       // short evocative caption
  tagline: string;           // audio/mood descriptor shown in picker
  gradient: string;          // CSS gradient fallback (always shown)
  imageSrc?: string;         // optional still image path
  videoSrc?: string;         // optional video path (takes priority over image)
  accent: string;            // hex accent color
  audioSrc?: string;         // path to ambient audio
  animationPreset?: AnimationPreset;
  grainOpacity: number;      // 0–1
  vignetteStrength: "normal" | "strong";
  hazeColor?: string;        // for haze overlay
  hazeOpacity?: number;
  videoDim?: number;         // extra dim applied to video (0–1, default 0.35)
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
