"use client";

/* eslint-disable @next/next/no-img-element */
import { memo, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { Scene } from "@/lib/types";
import HazeOverlay from "./HazeOverlay";

// Canvas overlays are only needed by scenes that opt in — keep them out of the
// main bundle until one does.
const RainOverlay = dynamic(() => import("./RainOverlay"), { ssr: false });
const DustOverlay = dynamic(() => import("./DustOverlay"), { ssr: false });

interface Props {
  scene: Scene;
  paused?: boolean;
  dimmed?: boolean;
}

/**
 * Layer order (bottom → top):
 *   gradient → poster → video (+ single dim pass) → overlays → vignette → grain → pause dim → accent glow
 *
 * Performance notes:
 *   - The poster paints immediately, so a scene switch never flashes to the
 *     bare gradient while the video buffers.
 *   - Exactly one semi-transparent pass sits over the video; no blend modes
 *     anywhere in the stack (each one forces an off-screen composite of every
 *     layer below it, every frame, on top of the video decode).
 *   - The video is paused while the tab is hidden so no decode work happens
 *     off-screen, and resumed on return.
 */
function SceneBackground({ scene, paused = false, dimmed = false }: Props) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset media state on scene change
  useEffect(() => {
    setVideoReady(false);
    setVideoError(false);
  }, [scene.id]);

  // Play/pause follows session state and tab visibility
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoReady) return;
    const sync = () => {
      if (paused || document.visibilityState === "hidden") {
        if (!v.paused) v.pause();
      } else if (v.paused) {
        // play() may be interrupted by a scene change — expected, ignore
        v.play().catch(() => {});
      }
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [paused, videoReady, scene.id]);

  const showVideo = videoReady && !videoError && !!scene.videoSrc;
  const hasMedia = !!scene.videoSrc || !!scene.posterSrc;
  const dim = scene.videoDim ?? 0.38;
  const dimGradient = `linear-gradient(
    to bottom,
    rgba(0,0,0,${Math.min(dim + 0.05, 0.55)}) 0%,
    rgba(0,0,0,${Math.max(dim - 0.08, 0.1)}) 40%,
    rgba(0,0,0,${Math.min(dim + 0.1, 0.6)}) 100%
  )`;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 0, isolation: "isolate" }}
      aria-hidden="true"
    >
      {/* ── 1. Gradient base — always visible ──────────────────────────────── */}
      <div className="absolute inset-0" style={{ background: scene.gradient }} />

      {/* ── 2. Poster — first frame, paints before the video decodes ───────── */}
      <AnimatePresence initial={false}>
        {scene.posterSrc && (
          <motion.div
            key={`poster-${scene.id}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <img
              src={scene.posterSrc}
              alt=""
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center bottom" }}
            />
            <div className="absolute inset-0" style={{ background: dimGradient }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Video — fades in over the poster once it can play ───────────── */}
      {scene.videoSrc && (
        <motion.div
          key={`video-layer-${scene.id}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: showVideo ? 1 : 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <video
            ref={videoRef}
            key={`video-${scene.id}`}
            src={scene.videoSrc}
            poster={scene.posterSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center bottom" }}
          />
          {/* Single darkening pass: videoDim + cinematic gradient in one layer */}
          <div className="absolute inset-0" style={{ background: dimGradient }} />
        </motion.div>
      )}

      {/* ── 4. Gradient drift (no media at all) ────────────────────────────── */}
      {!hasMedia && (
        <div
          className={`absolute inset-[-6%] ${
            paused || scene.animationPreset === "still" ? "" : "animate-drift-slow"
          }`}
          style={{ background: scene.gradient }}
        />
      )}

      {/* ── 5. Cinematic tint — media-less scenes only ─────────────────────── */}
      {!hasMedia && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(0,0,0,0.14) 0%,
              rgba(0,0,0,0.02) 45%,
              rgba(0,0,0,0.22) 100%
            )`,
          }}
        />
      )}

      {/* ── 6. Animation overlays ───────────────────────────────────────────── */}
      {(scene.animationPreset === "rain" || scene.animationPreset === "rain-city") && !paused && (
        <RainOverlay intensity={scene.animationPreset === "rain-city" ? "light" : "medium"} />
      )}

      {(scene.animationPreset === "haze" || scene.animationPreset === "still") &&
        scene.hazeColor &&
        !paused && (
          <HazeOverlay color={scene.hazeColor} opacity={scene.hazeOpacity ?? 0.25} />
        )}

      {scene.animationPreset === "dust" && !paused && <DustOverlay />}

      {/* ── 7. Vignette ─────────────────────────────────────────────────────── */}
      <div className={scene.vignetteStrength === "strong" ? "vignette vignette-strong" : "vignette"} />

      {/* ── 8. Film grain ───────────────────────────────────────────────────── */}
      <div className="grain-overlay" style={{ opacity: scene.grainOpacity }} />

      {/* ── 9. Pause / dim overlay ──────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: dimmed ? 0.5 : paused ? 0.38 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ pointerEvents: "none" }}
      />

      {/* ── 10. Accent ambient edge glow (plain alpha, no blend mode) ───────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 55%, ${scene.accent}1f 0%, transparent 55%)`,
        }}
      />
    </div>
  );
}

export default memo(SceneBackground);
