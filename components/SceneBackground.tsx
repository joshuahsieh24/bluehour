"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Scene } from "@/lib/types";
import RainOverlay from "./RainOverlay";
import HazeOverlay from "./HazeOverlay";
import DustOverlay from "./DustOverlay";

interface Props {
  scene: Scene;
  paused?: boolean;
  dimmed?: boolean;
}

export default function SceneBackground({ scene, paused = false, dimmed = false }: Props) {
  // Video state
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Image state (fallback when no video)
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset all media state on scene change
  useEffect(() => {
    setVideoReady(false);
    setVideoError(false);
    setImgLoaded(false);
    setImgError(false);
  }, [scene.id]);

  // Pause/resume video with session state
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoReady) return;
    if (paused) {
      v.pause();
    } else {
      // Suppress the DOMException if play() gets interrupted — expected behaviour
      v.play().catch(() => {});
    }
  }, [paused, videoReady]);

  const showVideo = videoReady && !videoError && !!scene.videoSrc;
  const showImage = !showVideo && imgLoaded && !imgError && !!scene.imageSrc;
  const dim = scene.videoDim ?? 0.38;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* ── 1. Gradient base — always visible ──────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{ background: scene.gradient }}
      />

      {/* ── 2. Video background ─────────────────────────────────────────────── */}
      {scene.videoSrc && (
        // Single video element — loads in place, fades in when ready.
        // No duplicate elements or competing CSS transforms that cause jitter.
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
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Single darkening pass — consolidates videoDim + cinematic gradient
              into one layer so we don't stack multiple semi-transparent composites
              over the video, which compresses fine detail. */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                rgba(0,0,0,${Math.min(dim + 0.05, 0.55)}) 0%,
                rgba(0,0,0,${Math.max(dim - 0.08, 0.1)}) 40%,
                rgba(0,0,0,${Math.min(dim + 0.1, 0.60)}) 100%
              )`,
            }}
          />
        </motion.div>
      )}

      {/* ── 3. Still image fallback (when no video) ─────────────────────────── */}
      {!scene.videoSrc && scene.imageSrc && (
        <>
          {/* Hidden preloader — img used intentionally for onLoad/onError */}
          <img
            src={scene.imageSrc}
            alt=""
            className="sr-only"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
          <AnimatePresence>
            {showImage && (
              <motion.div
                key={`img-${scene.id}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <div
                  className={`absolute inset-[-6%] bg-cover bg-center ${
                    paused ? "" : "animate-drift-slow"
                  }`}
                  style={{ backgroundImage: `url(${scene.imageSrc})` }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── 4. Gradient drift animation (when no media ready) ───────────────── */}
      {!showVideo && !showImage && (
        <div
          className={`absolute inset-[-6%] ${paused ? "" : "animate-drift-slow"}`}
          style={{ background: scene.gradient }}
        />
      )}

      {/* ── 5. Cinematic tint — gradient-only scenes (no video) ────────────── */}
      {/* For video scenes this is folded into the video dim layer above       */}
      {!scene.videoSrc && (
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
        <RainOverlay
          intensity={scene.animationPreset === "rain-city" ? "light" : "medium"}
        />
      )}

      {(scene.animationPreset === "haze" || scene.animationPreset === "still") &&
        scene.hazeColor &&
        !paused && (
          <HazeOverlay color={scene.hazeColor} opacity={scene.hazeOpacity ?? 0.25} />
        )}

      {scene.animationPreset === "dust" && !paused && <DustOverlay />}

      {/* ── 7. Vignette ─────────────────────────────────────────────────────── */}
      <div
        className={
          scene.vignetteStrength === "strong" ? "vignette vignette-strong" : "vignette"
        }
      />

      {/* ── 8. Film grain ───────────────────────────────────────────────────── */}
      <div
        className="grain-overlay"
        style={{ opacity: scene.grainOpacity }}
      />

      {/* ── 9. Pause / dim overlay ──────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: dimmed ? 0.5 : paused ? 0.38 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* ── 10. Accent ambient edge glow ────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 55%, ${scene.accent}14 0%, transparent 55%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
