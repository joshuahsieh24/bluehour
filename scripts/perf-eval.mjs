#!/usr/bin/env node
/**
 * bluehour runtime eval — drives the real app in a visible Chrome window and
 * reports, per video scene:
 *   - frame pacing (fps, p95 frame gap, frames over 33ms)
 *   - dropped video frames
 *   - audio state after begin / mute toggle / pause+resume / scene switch
 *   - bytes transferred by type
 *   - console errors
 *
 * Usage:
 *   npm run build && npx next start -p 3100 &
 *   node scripts/perf-eval.mjs [--url http://localhost:3100] [--sample 6000] [--scenes rainy-cafe,midnight-jazz]
 *
 * Requires Google Chrome (uses the installed browser via playwright-core, no download).
 * The window must stay visible — Chrome throttles rAF and video in hidden tabs.
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1] ?? true] : [])).filter(Boolean)
);
const BASE = args.url ?? "http://localhost:3100";
const SAMPLE_MS = Number(args.sample ?? 6000);
const SETTLE_MS = Number(args.settle ?? 5000);
const ONLY = args.scenes ? String(args.scenes).split(",") : null;

const here = path.dirname(fileURLToPath(import.meta.url));
const probeSrc = readFileSync(path.join(here, "perf-probe.js"), "utf8");

// Scene ids → picker labels (lib/scenes.ts). Only scenes with video are measured for frames;
// all scenes with audio are measured for audio.
const SCENES = [
  { id: "rainy-cafe", name: "after rain" },
  { id: "midnight-jazz", name: "after hours" },
  { id: "piano-room", name: "lamplight" },
  { id: "night-library", name: "soft room" },
  { id: "city-window", name: "city glow" },
];

const audioSnapshot = (page) =>
  page.evaluate(() => {
    // Engine elements live in the DOM; legacy Howler nodes were detached, so
    // also look inside Howler's registry for a fair before/after comparison.
    const dom = [...document.querySelectorAll("audio")];
    const howler = (window.Howler?._howls ?? []).flatMap((h) => h._sounds.map((s) => s._node).filter(Boolean));
    return [...new Set([...dom, ...howler])].map((a) => ({
      src: (a.currentSrc || a.src || "").split("/").pop() || "(none)",
      paused: a.paused,
      t: +a.currentTime.toFixed(2),
      vol: +a.volume.toFixed(2),
      ready: a.readyState,
      err: a.error ? a.error.code : null,
    }));
  });

// "Playing" = some element is unpaused, has data, and its clock advances.
async function audioIsPlaying(page, waitMs = 1500) {
  const a = await audioSnapshot(page);
  await page.waitForTimeout(waitMs);
  const b = await audioSnapshot(page);
  return b.some((el, i) => !el.paused && el.ready >= 2 && a[i] && el.t > a[i].t);
}

async function runScene(browser, scene) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));

  // "load", not "networkidle": the ambient track streams, so the network is never idle.
  await page.goto(`${BASE}/focus`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  // Dismiss recovery overlay if a previous run left a session behind.
  const startOver = page.getByText(/start over/i);
  if (await startOver.count()) await startOver.first().click();

  // Turn off "open in fullscreen on start" so the window geometry stays fixed.
  const fsToggle = page.getByText("open in fullscreen on start");
  await fsToggle.click();

  await page.getByRole("button", { name: scene.name }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "begin" }).click();
  await page.waitForTimeout(SETTLE_MS);

  const audioAfterBegin = await audioIsPlaying(page);

  await page.addScriptTag({ content: probeSrc });
  const probe = await page.evaluate((ms) => window.__bhProbe(ms), SAMPLE_MS);

  // Interaction paths that historically lose audio.
  await page.keyboard.press("m"); // mute
  await page.waitForTimeout(900);
  await page.keyboard.press("m"); // unmute
  await page.waitForTimeout(1500);
  const audioAfterMuteToggle = await audioIsPlaying(page);

  await page.keyboard.press("Space"); // pause
  await page.waitForTimeout(1200);
  await page.keyboard.press("Space"); // resume
  await page.waitForTimeout(1500);
  const audioAfterPauseResume = await audioIsPlaying(page);

  // Scene switch mid-session via the in-session sidebar.
  const next = SCENES[(SCENES.findIndex((s) => s.id === scene.id) + 1) % SCENES.length];
  await page.keyboard.press("s");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: next.name }).first().click();
  await page.waitForTimeout(3500);
  const audioAfterSceneSwitch = await audioIsPlaying(page);
  const videoAfterSwitch = await page.evaluate(() => {
    const v = document.querySelector("video");
    return v ? { src: v.currentSrc.split("/").pop(), paused: v.paused, ready: v.readyState } : null;
  });

  await ctx.close();
  return {
    scene: scene.id,
    fps: probe.frames.fps,
    p95GapMs: probe.frames.p95GapMs,
    worstGapMs: probe.frames.worstGapMs,
    over33ms: probe.frames.framesOver33ms,
    longTasks: probe.longTasks.count,
    video: probe.media.videos[0] ? `${probe.media.videos[0].size} dropped ${probe.media.videos[0].droppedPct}%` : "none",
    videoKB: Math.round((probe.transferBytes.video ?? 0) / 1024),
    imageKB: Math.round((probe.transferBytes.image ?? 0) / 1024),
    scriptKB: Math.round((probe.transferBytes.script ?? 0) / 1024),
    audio: { begin: audioAfterBegin, muteToggle: audioAfterMuteToggle, pauseResume: audioAfterPauseResume, sceneSwitch: audioAfterSceneSwitch },
    videoAfterSwitch,
    errors: [...new Set(errors)],
  };
}

// --mute-audio silences the speakers only; elements still play and their clocks
// still advance, so the audio checks are unaffected.
const browser = await chromium.launch({
  channel: "chrome",
  headless: false,
  args: ["--window-position=40,40", "--mute-audio"],
});
const results = [];
for (const scene of SCENES) {
  if (ONLY && !ONLY.includes(scene.id)) continue;
  process.stderr.write(`▸ ${scene.id}\n`);
  try {
    results.push(await runScene(browser, scene));
  } catch (e) {
    results.push({ scene: scene.id, error: String(e).slice(0, 300) });
  }
}
await browser.close();

const rows = results.map((r) =>
  r.error
    ? { scene: r.scene, error: r.error }
    : {
        scene: r.scene,
        fps: r.fps,
        "p95 gap": r.p95GapMs,
        worst: r.worstGapMs,
        ">33ms": r.over33ms,
        "long tasks": r.longTasks,
        video: r.video,
        "video KB": r.videoKB,
        "img KB": r.imageKB,
        "audio begin/mute/pause/switch": `${r.audio.begin ? "✓" : "✗"} ${r.audio.muteToggle ? "✓" : "✗"} ${r.audio.pauseResume ? "✓" : "✗"} ${r.audio.sceneSwitch ? "✓" : "✗"}`,
        errors: r.errors.length,
      }
);
console.table(rows);
for (const r of results) if (r.errors?.length) console.log(`${r.scene} console errors:`, r.errors);
console.log(JSON.stringify(results, null, 2));
