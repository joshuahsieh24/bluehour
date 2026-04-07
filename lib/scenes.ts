import type { Scene } from "./types";

// Videos: served from Vercel edge CDN via public/scenes/ → /scenes/*.mp4
//         Exception: gojoscene.mp4 (65MB) served from GitHub CDN — too large for Vercel Hobby limit
// Audio:  served from GitHub CDN — excluded from Vercel build output
const AUDIO =
  "https://raw.githubusercontent.com/joshuahsieh24/bluehour/main/public/audio";
const SCENES_CDN =
  "https://raw.githubusercontent.com/joshuahsieh24/bluehour/main/public/scenes";

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
    audioSrc: `${AUDIO}/loficafe.mp3`,
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
    audioSrc: `${AUDIO}/hogwart.mp3`,
    animationPreset: "haze",
    grainOpacity: 0.04,
    vignetteStrength: "strong",
    hazeColor: "rgba(139, 115, 85, 0.06)",
    hazeOpacity: 0.15,
    videoDim: 0.35,
  },
  {
    // Scene ID kept stable — changing it would break localStorage history.
    // Video swapped from pianoroom.mp4 → nightstudy.mp4.
    // Piano audio still fits a warm night-study scene; no audio change.
    id: "piano-room",
    name: "lamplight",
    description: "one lamp, the work close",
    tagline: "warm and still",
    gradient:
      "radial-gradient(ellipse at 60% 40%, #1f1208 0%, #130d05 45%, #0a0703 100%)",
    videoSrc: "/scenes/nightstudy.mp4",
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
    // Scene ID kept stable. Video: moonnight.mp4 → ylia.mp4.
    // Audio: librarysound.mp3 → kousei.mp3 (Kousei from YLIA — piano, emotional, intimate).
    // Renamed from "moonlit stacks" — the new pairing is a warm, enclosed interior with
    // emotional piano music, not a library. "soft room" fits the intimacy of both assets.
    id: "night-library",
    name: "soft room",
    description: "piano in the dark",
    tagline: "still and close",
    gradient:
      "radial-gradient(ellipse at 50% 40%, #1a150d 0%, #100e08 50%, #080704 100%)",
    videoSrc: "/scenes/ylia.mp4",
    accent: "#a89070",
    audioSrc: `${AUDIO}/kousei.mp3`,
    animationPreset: "still",
    grainOpacity: 0.03,
    vignetteStrength: "strong",
    hazeColor: "rgba(168, 144, 112, 0.05)",
    hazeOpacity: 0.12,
    videoDim: 0.36,
  },
  {
    id: "city-window",
    name: "city glow",
    description: "neon and distance",
    tagline: "the city, just outside",
    gradient:
      "radial-gradient(ellipse at 50% 70%, #08091a 0%, #050610 40%, #020308 100%)",
    videoSrc: `${SCENES_CDN}/gojoscene.mp4`,
    accent: "#5058b8",
    audioSrc: `${AUDIO}/citywindow.mp3`,
    animationPreset: "still",
    grainOpacity: 0.028,
    vignetteStrength: "normal",
    videoDim: 0.22,
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
