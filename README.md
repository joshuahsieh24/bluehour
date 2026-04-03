# bluehour

a place to settle in.

A fullscreen focus app designed for second-monitor work. Calm live ambient scenes, optional ambient audio, and a minimal timer/task overlay.

---

## Setup

**Requirements:** Node 18+

```bash
npm install
```

## Local Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import from GitHub.
3. Framework preset: **Next.js** (auto-detected).
4. No environment variables required for V1.
5. Click **Deploy**.

Vercel CLI alternative:

```bash
npm i -g vercel
vercel
```

---

## Replacing Scene Images

Each scene uses a CSS gradient fallback. To add real photography:

1. Add image files to `public/scenes/`:
   - `public/scenes/rainy-cafe.jpg`
   - `public/scenes/midnight-jazz.jpg`
   - `public/scenes/piano-room.jpg`
   - `public/scenes/night-library.jpg`
   - `public/scenes/city-window.jpg`
   - `public/scenes/silent-study.jpg`

2. Images automatically load and fade in over the gradient. No code changes needed.

**Image tips:**
- Dark, cinematic, minimal — avoid bright or busy images
- Landscape orientation, high resolution (1920×1080+)
- The left 30% of each image should be text-safe (low contrast) for the pre-session panel

---

## Replacing Scene Audio

Add `.mp3` files to `public/audio/`:
- `public/audio/rainy-cafe.mp3`
- `public/audio/midnight-jazz.mp3`
- `public/audio/piano-room.mp3`
- `public/audio/night-library.mp3`
- `public/audio/city-window.mp3`

Audio loops automatically. `silent-study` has no audio by design.

---

## Scene Config System

Scenes are defined in `lib/scenes.ts`. Each scene is a `Scene` object:

```ts
{
  id: SceneId;           // unique key
  name: string;          // lowercase display name
  description: string;   // one-line preview caption
  gradient: string;      // CSS gradient (always shown — fallback + tint)
  imageSrc?: string;     // optional path under /public/scenes/
  accent: string;        // hex color for ring, glow, card accent bar
  audioSrc?: string;     // optional path under /public/audio/
  animationPreset:       // which animation overlay to render
    | "rain" | "haze" | "dust" | "still" | "rain-city";
  grainOpacity: number;           // 0–1 film grain strength
  vignetteStrength: "normal" | "strong";
  hazeColor?: string;             // rgba for haze/smoke overlay
  hazeOpacity?: number;
}
```

To **add a new scene**:
1. Add an entry to `SCENES` in `lib/scenes.ts`
2. Add its id to the `SceneId` union in `lib/types.ts`
3. Drop image + audio in `/public`

---

## Architecture

```
app/
  page.tsx              Landing page (/)
  focus/
    page.tsx            Focus route shell
    FocusClient.tsx     Full focus experience — state machine
  history/
    page.tsx            Session history log

lib/
  types.ts              All shared TypeScript types
  scenes.ts             Scene config + helpers
  storage.ts            localStorage + session utilities

components/
  SceneBackground       Fullscreen scene + image loader
  RainOverlay           Canvas rain animation
  HazeOverlay           CSS haze/fog layers
  DustOverlay           Canvas particle dust
  FocusRing             SVG circular progress ring
  ScenePicker           6-up scene selection grid
  OverlayControls       Bottom controls (pause, mute, end, fullscreen)
  ReturnOverlay         Interruption return modal
  CompletionCard        Session complete + reflection prompts
  EndSessionModal       Confirm end-session dialog
  RecoveryOverlay       Session recovery after page reload
  AudioController       Howler.js wrapper (client-side only)
  FullscreenToggle      useFullscreen() hook
```

**Focus state machine:** `pre-session → active ↔ paused → complete`
**Interruption path:** `active → interrupted → active`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause / Resume |
| `F` | Toggle fullscreen |
| `M` | Mute / Unmute |
| `Esc` | Exit fullscreen |

---

## V1 Exclusions (extensible later)

- Auth / accounts
- Supabase / cloud sync
- Spotify / YouTube integration
- Streaks, charts, analytics
- Social features
- Mobile layout
