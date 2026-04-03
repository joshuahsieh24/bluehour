import type { Scene } from "./types";

export const SCENES: Scene[] = [
  {
    id: "rainy-cafe",
    name: "rainy café",
    description: "cool glass, soft rain",
    gradient:
      "radial-gradient(ellipse at 30% 60%, #1a2535 0%, #111620 40%, #090c12 100%)",
    imageSrc: "/scenes/rainy-cafe.jpg",
    accent: "#4a7ba8",
    audioSrc: "/audio/rainy-cafe.mp3",
    animationPreset: "rain",
    grainOpacity: 0.035,
    vignetteStrength: "normal",
  },
  {
    id: "midnight-jazz",
    name: "midnight jazz",
    description: "low light, distant brass",
    gradient:
      "radial-gradient(ellipse at 40% 70%, #0d1829 0%, #080e1a 50%, #050810 100%)",
    imageSrc: "/scenes/midnight-jazz.jpg",
    accent: "#8b7355",
    audioSrc: "/audio/midnight-jazz.mp3",
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
    gradient:
      "radial-gradient(ellipse at 60% 40%, #1f1208 0%, #130d05 45%, #0a0703 100%)",
    imageSrc: "/scenes/piano-room.jpg",
    accent: "#c4813a",
    audioSrc: "/audio/piano-room.mp3",
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
    gradient:
      "radial-gradient(ellipse at 50% 30%, #14111a 0%, #0d0b12 50%, #080609 100%)",
    imageSrc: "/scenes/night-library.jpg",
    accent: "#7a6f8a",
    audioSrc: "/audio/night-library.mp3",
    animationPreset: "dust",
    grainOpacity: 0.045,
    vignetteStrength: "strong",
  },
  {
    id: "city-window",
    name: "city window",
    description: "distant lights, soft rain",
    gradient:
      "radial-gradient(ellipse at 50% 80%, #0d1520 0%, #080f18 40%, #040810 100%)",
    imageSrc: "/scenes/city-window.jpg",
    accent: "#3d6080",
    audioSrc: "/audio/city-window.mp3",
    animationPreset: "rain-city",
    grainOpacity: 0.032,
    vignetteStrength: "normal",
  },
  {
    id: "silent-study",
    name: "silent study",
    description: "dark, still, empty",
    gradient:
      "radial-gradient(ellipse at 50% 40%, #131316 0%, #0c0c0e 50%, #080809 100%)",
    imageSrc: "/scenes/silent-study.jpg",
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
