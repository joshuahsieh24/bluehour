"use client";

import { motion } from "framer-motion";
import { SCENES } from "@/lib/scenes";
import type { SceneId } from "@/lib/types";

interface Props {
  selected: SceneId;
  onSelect: (id: SceneId) => void;
}

export default function ScenePicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SCENES.map((scene) => {
        const isActive = scene.id === selected;
        return (
          <motion.button
            key={scene.id}
            onClick={() => onSelect(scene.id)}
            className="relative rounded-lg overflow-hidden text-left transition-all duration-500 group no-select"
            style={{
              height: 72,
              border: `1px solid ${isActive ? `${scene.accent}60` : "rgba(255,255,255,0.07)"}`,
              boxShadow: isActive ? `0 0 0 1px ${scene.accent}30, 0 4px 20px rgba(0,0,0,0.5)` : "none",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* Scene gradient preview */}
            <div
              className="absolute inset-0"
              style={{ background: scene.gradient }}
            />

            {/* Accent glow on selected */}
            {isActive && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: `radial-gradient(ellipse at 50% 50%, ${scene.accent}20 0%, transparent 70%)`,
                }}
              />
            )}

            {/* Overlay */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)",
                opacity: isActive ? 0.7 : 0.85,
              }}
            />

            {/* Text */}
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <p
                className="text-xs font-light leading-none"
                style={{
                  color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)",
                  letterSpacing: "0.01em",
                  fontSize: 11,
                }}
              >
                {scene.name}
              </p>
            </div>

            {/* Selected indicator */}
            {isActive && (
              <motion.div
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: scene.accent }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
