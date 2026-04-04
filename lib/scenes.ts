import type { Scene } from "./types";

// Videos: served from Vercel edge CDN via public/scenes/ → /scenes/*.mp4
// Audio:  served from GitHub CDN (files are ~68MB total, excluded from Vercel deploy)
const AUDIO =
  "https://raw.githubusercontent.com/joshuahsieh24/bluehour/main/public/audio";

export const SCENES: Scene[] = [
  {
    id: "rainy-cafe",
    name: "after rain",
    description: "cool glass, the streets still wet",
    tagline: "quiet after the rain",
    gradient:
      "radial-gradient(ellipse at 30% 60%, #1a2535 0%, #111620 40%, #090c12 100%)",
    videoSrc: "/scenes/lofi-cafe.mp4",
    accent: "#4a7ba8",
    audioSrc: `${AUDIO}/rainyjazz.mp3`,
    animationPreset: "rain",
    grainOpacity: 0.03,
    vignetteStrength: "normal",
    videoDim: 0.4,
  },
  {
    id: "midnight-jazz",
    name: "after hours",
    description: "low light, no agenda",
    tagline: "late and still",
    gradient:
      "radial-gradient(ellipse at 40% 70%, #0d1829 0%, #080e1a 50%, #050810 100%)",
    videoSrc: "/scenes/hogwarts.mp4",
    accent: "#8b7355",
    audioSrc: `${AUDIO}/nightjazz.mp3`,
    animationPreset: "haze",
    grainOpacity: 0.04,
    vignetteStrength: "strong",
    hazeColor: "rgba(139, 115, 85, 0.06)",
    hazeOpacity: 0.15,
    videoDim: 0.35,
  },
  {
    id: "piano-room",
    name: "lamplight",
    description: "amber light, near-silence",
    tagline: "warm and still",
    gradient:
      "radial-gradient(ellipse at 60% 40%, #1f1208 0%, #130d05 45%, #0a0703 100%)",
    videoSrc: "/scenes/pianoroom.mp4",
    accent: "#c4813a",
    audioSrc: `${AUDIO}/pianoroom.mp3`,
    animationPreset: "still",
    grainOpacity: 0.03,
    vignetteStrength: "strong",
    hazeColor: "rgba(196, 129, 58, 0.04)",
    hazeOpacity: 0.12,
    videoDim: 0.34,
  },
  {
    id: "night-library",
    name: "moonlit stacks",
    description: "silver light, quiet rows",
    tagline: "still and attentive",
    gradient:
      "radial-gradient(ellipse at 50% 30%, #14111a 0%, #0d0b12 50%, #080609 100%)",
    videoSrc: "/scenes/moonnight.mp4",
    accent: "#7a6f8a",
    audioSrc: `${AUDIO}/librarysound.mp3`,
    animationPreset: "dust",
    grainOpacity: 0.035,
    vignetteStrength: "strong",
    videoDim: 0.38,
  },
  {
    id: "city-window",
    name: "city glow",
    description: "neon and distance",
    tagline: "the city, just outside",
    gradient:
      "radial-gradient(ellipse at 50% 80%, #0d1520 0%, #080f18 40%, #040810 100%)",
    videoSrc: "/scenes/neoncity.mp4",
    accent: "#3d6080",
    audioSrc: `${AUDIO}/citywindow.mp3`,
    animationPreset: "rain-city",
    grainOpacity: 0.028,
    vignetteStrength: "normal",
    videoDim: 0.38,
  },
  {
    id: "silent-study",
    name: "still hour",
    description: "dark, still, nothing",
    tagline: "nothing but the work",
    gradient:
      "radial-gradient(ellipse at 50% 40%, #131316 0%, #0c0c0e 50%, #080809 100%)",
    accent: "#4a4a52",
    audioSrc: undefined,
    animationPreset: "still",
    grainOpacity: 0.022,
    vignetteStrength: "strong",
  },
];

export const SCENE_MAP = Object.fromEntries(
  SCENES.map((s) => [s.id, s])
) as Record<string, Scene>;

export function getScene(id: string): Scene {
  return SCENE_MAP[id] ?? SCENES[0];
}
