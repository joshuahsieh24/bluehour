import type { Scene } from "./types";

// Audio and video assets are served from GitHub's CDN so Vercel deployments
// stay small. The repo must remain public for these URLs to resolve.
const GITHUB_RAW =
  "https://raw.githubusercontent.com/joshuahsieh24/bluehour/main/public";

export const SCENES: Scene[] = [
  {
    id: "rainy-cafe",
    name: "rainy café",
    description: "cool glass, soft rain",
    tagline: "rain and room tone",
    gradient:
      "radial-gradient(ellipse at 30% 60%, #1a2535 0%, #111620 40%, #090c12 100%)",
    // Primary hero scene — real video background
    videoSrc: `${GITHUB_RAW}/scenes/rainyjazzvid.mp4`,
    accent: "#4a7ba8",
    audioSrc: `${GITHUB_RAW}/audio/rainyjazz.mp3`,
    animationPreset: "rain",
    grainOpacity: 0.03,
    vignetteStrength: "normal",
    videoDim: 0.42,
  },
  {
    id: "midnight-jazz",
    name: "midnight jazz",
    description: "low light, distant brass",
    tagline: "late and low-lit",
    gradient:
      "radial-gradient(ellipse at 40% 70%, #0d1829 0%, #080e1a 50%, #050810 100%)",
    accent: "#8b7355",
    audioSrc: `${GITHUB_RAW}/audio/nightjazz.mp3`,
    animationPreset: "haze",
    grainOpacity: 0.04,
    vignetteStrength: "strong",
    hazeColor: "rgba(139, 115, 85, 0.12)",
    hazeOpacity: 0.3,
  },
  {
    id: "piano-room",
    name: "piano room",
    description: "warm lamp, near-silence",
    tagline: "warm lamp, near-silence",
    gradient:
      "radial-gradient(ellipse at 60% 40%, #1f1208 0%, #130d05 45%, #0a0703 100%)",
    accent: "#c4813a",
    audioSrc: `${GITHUB_RAW}/audio/pianoroom.mp3`,
    animationPreset: "still",
    grainOpacity: 0.03,
    vignetteStrength: "strong",
    hazeColor: "rgba(196, 129, 58, 0.06)",
    hazeOpacity: 0.2,
  },
  {
    id: "night-library",
    name: "night library",
    description: "dark stacks, quiet dust",
    tagline: "still and attentive",
    gradient:
      "radial-gradient(ellipse at 50% 30%, #14111a 0%, #0d0b12 50%, #080609 100%)",
    accent: "#7a6f8a",
    audioSrc: `${GITHUB_RAW}/audio/librarysound.mp3`,
    animationPreset: "dust",
    grainOpacity: 0.045,
    vignetteStrength: "strong",
  },
  {
    id: "city-window",
    name: "city window",
    description: "distant lights, soft rain",
    tagline: "distant lights and weather",
    gradient:
      "radial-gradient(ellipse at 50% 80%, #0d1520 0%, #080f18 40%, #040810 100%)",
    accent: "#3d6080",
    audioSrc: `${GITHUB_RAW}/audio/citywindow.mp3`,
    animationPreset: "rain-city",
    grainOpacity: 0.032,
    vignetteStrength: "normal",
  },
  {
    id: "silent-study",
    name: "silent study",
    description: "dark, still, nothing",
    tagline: "nothing but the work",
    gradient:
      "radial-gradient(ellipse at 50% 40%, #131316 0%, #0c0c0e 50%, #080809 100%)",
    accent: "#4a4a52",
    audioSrc: undefined,
    animationPreset: "still",
    grainOpacity: 0.025,
    vignetteStrength: "strong",
  },
];

export const SCENE_MAP = Object.fromEntries(
  SCENES.map((s) => [s.id, s])
) as Record<string, Scene>;

export function getScene(id: string): Scene {
  return SCENE_MAP[id] ?? SCENES[0];
}
