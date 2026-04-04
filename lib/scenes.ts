import type { Scene } from "./types";

// All assets are served locally from public/ via Next.js / Vercel's edge CDN.
// Videos: public/scenes/*.mp4  →  /scenes/*.mp4
// Audio:  public/audio/*.mp3   →  /audio/*.mp3

export const SCENES: Scene[] = [
  {
    id: "rainy-cafe",
    name: "rainy café",
    description: "cool glass, soft rain",
    tagline: "rain and room tone",
    gradient:
      "radial-gradient(ellipse at 30% 60%, #1a2535 0%, #111620 40%, #090c12 100%)",
    videoSrc: "/scenes/rainyjazzvid.mp4",
    accent: "#4a7ba8",
    audioSrc: "/audio/rainyjazz.mp3",
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
    videoSrc: "/scenes/cozyjazz.mp4",
    accent: "#8b7355",
    audioSrc: "/audio/nightjazz.mp3",
    animationPreset: "haze",
    grainOpacity: 0.04,
    vignetteStrength: "strong",
    hazeColor: "rgba(139, 115, 85, 0.08)",
    hazeOpacity: 0.2,
    videoDim: 0.38,
  },
  {
    id: "piano-room",
    name: "piano room",
    description: "amber light, near-silence",
    tagline: "warm and still",
    gradient:
      "radial-gradient(ellipse at 60% 40%, #1f1208 0%, #130d05 45%, #0a0703 100%)",
    videoSrc: "/scenes/kittyblues.mp4",
    accent: "#c4813a",
    audioSrc: "/audio/pianoroom.mp3",
    animationPreset: "still",
    grainOpacity: 0.03,
    vignetteStrength: "strong",
    hazeColor: "rgba(196, 129, 58, 0.05)",
    hazeOpacity: 0.15,
    videoDim: 0.36,
  },
  {
    id: "night-library",
    name: "night library",
    description: "dark stacks, quiet dust",
    tagline: "still and attentive",
    gradient:
      "radial-gradient(ellipse at 50% 30%, #14111a 0%, #0d0b12 50%, #080609 100%)",
    videoSrc: "/scenes/libraryvibe.mp4",
    accent: "#7a6f8a",
    audioSrc: "/audio/librarysound.mp3",
    animationPreset: "dust",
    grainOpacity: 0.04,
    vignetteStrength: "strong",
    videoDim: 0.44,
  },
  {
    id: "city-window",
    name: "city window",
    description: "distant lights, soft rain",
    tagline: "distant lights and weather",
    gradient:
      "radial-gradient(ellipse at 50% 80%, #0d1520 0%, #080f18 40%, #040810 100%)",
    videoSrc: "/scenes/citynight.mp4",
    accent: "#3d6080",
    audioSrc: "/audio/citywindow.mp3",
    animationPreset: "rain-city",
    grainOpacity: 0.032,
    vignetteStrength: "normal",
    videoDim: 0.4,
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
