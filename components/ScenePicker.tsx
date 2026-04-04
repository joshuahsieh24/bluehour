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
    <div className="grid grid-cols-3 gap-1.5">
      {SCENES.map((scene) => {
        const isActive = scene.id === selected;
        return (
          <motion.button
            key={scene.id}
            onClick={() => onSelect(scene.id)}
            className="relative rounded-lg overflow-hidden text-left no-select"
            style={{
              height: 70,
              border: `1px solid ${
                isActive ? `${scene.accent}55` : "rgba(255,255,255,0.06)"
              }`,
              boxShadow: isActive
                ? `0 0 0 1px ${scene.accent}20, inset 0 0 12px ${scene.accent}10`
                : "none",
              transition: "border-color 400ms ease, box-shadow 400ms ease",
            }}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.975 }}
            transition={{ duration: 0.18 }}
          >
            {/* Gradient base */}
            <div
              className="absolute inset-0"
              style={{ background: scene.gradient }}
            />

            {/* Active accent glow */}
            {isActive && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  background: `radial-gradient(ellipse at 50% 80%, ${scene.accent}22 0%, transparent 75%)`,
                }}
              />
            )}

            {/* Dark overlay — less dark when active */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.58) 100%)",
                opacity: isActive ? 0.75 : 0.9,
                transition: "opacity 350ms ease",
              }}
            />

            {/* Text — name + tagline */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5">
              <p
                style={{
                  color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                  fontSize: 10,
                  fontWeight: 300,
                  letterSpacing: "0.01em",
                  lineHeight: 1,
                  marginBottom: 2,
                  transition: "color 350ms ease",
                }}
              >
                {scene.name}
              </p>
              <p
                style={{
                  color: isActive ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.22)",
                  fontSize: 9,
                  fontWeight: 300,
                  letterSpacing: "0.01em",
                  lineHeight: 1,
                  transition: "color 350ms ease",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {scene.tagline}
              </p>
            </div>

            {/* Has-video indicator */}
            {scene.videoSrc && (
              <div
                className="absolute top-1.5 left-1.5"
                title="live scene"
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: isActive ? scene.accent : "rgba(255,255,255,0.2)",
                  transition: "background 400ms ease",
                }}
              />
            )}

            {/* Selected dot */}
            {isActive && (
              <motion.div
                className="absolute top-1.5 right-1.5 rounded-full"
                style={{ width: 5, height: 5, background: scene.accent }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.22 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
