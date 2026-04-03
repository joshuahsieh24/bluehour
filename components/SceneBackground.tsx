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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset on scene change
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [scene.id]);

  const showImage = imgLoaded && !imgError && !!scene.imageSrc;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Gradient base — always present */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ background: scene.gradient }}
      />

      {/* Real image — fades in over gradient when loaded */}
      {scene.imageSrc && (
        <>
          {/* Hidden preloader — intentionally uses img for onLoad/onError */}
          <img
            ref={imgRef}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0"
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

      {/* Gradient drift (when no image or image not loaded) */}
      {!showImage && (
        <div
          className={`absolute inset-[-6%] ${paused ? "" : "animate-drift-slow"}`}
          style={{ background: scene.gradient }}
        />
      )}

      {/* Tint layer for cohesion */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.35) 100%)`,
        }}
      />

      {/* Animation overlays */}
      {(scene.animationPreset === "rain" || scene.animationPreset === "rain-city") && !paused && (
        <RainOverlay
          intensity={scene.animationPreset === "rain-city" ? "light" : "medium"}
        />
      )}

      {(scene.animationPreset === "haze" || scene.animationPreset === "still") &&
        scene.hazeColor && !paused && (
          <HazeOverlay color={scene.hazeColor} opacity={scene.hazeOpacity ?? 0.25} />
        )}

      {scene.animationPreset === "dust" && !paused && <DustOverlay />}

      {/* Vignette */}
      <div
        className={
          scene.vignetteStrength === "strong" ? "vignette vignette-strong" : "vignette"
        }
      />

      {/* Film grain */}
      <div
        className="grain-overlay"
        style={{ opacity: scene.grainOpacity }}
      />

      {/* Pause / dim overlay */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: dimmed ? 0.45 : paused ? 0.35 : 0 }}
        transition={{ duration: 600 / 1000, ease: "easeInOut" }}
      />

      {/* Accent tint on sides */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, ${scene.accent}18 0%, transparent 60%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
