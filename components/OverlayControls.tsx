"use client";

import { motion } from "framer-motion";
import type { Scene } from "@/lib/types";

interface Props {
  scene: Scene;
  paused: boolean;
  muted: boolean;
  volume: number;
  onPauseResume: () => void;
  onMute: () => void;
  onVolumeChange: (v: number) => void;
  onEnd: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  visible: boolean;
}

export default function OverlayControls({
  scene,
  paused,
  muted,
  volume,
  onPauseResume,
  onMute,
  onVolumeChange,
  onEnd,
  onFullscreen,
  isFullscreen,
  visible,
}: Props) {
  const fillPct = Math.round(volume * 100);

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 flex items-end justify-between px-8 pb-8"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{ pointerEvents: visible ? "auto" : "none", zIndex: 30 }}
    >
      {/* Scene name — bottom left */}
      <p
        className="text-xs font-light tracking-widest uppercase no-select"
        style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", fontSize: 10 }}
      >
        {scene.name}
      </p>

      {/* Controls — bottom center */}
      <div className="flex items-center gap-6">
        {/* Pause / Resume */}
        <ControlButton
          onClick={onPauseResume}
          label={paused ? "resume" : "pause"}
          title={paused ? "Resume (Space)" : "Pause (Space)"}
        />

        {/* Mute + Volume — grouped together */}
        {scene.audioSrc && (
          <div className="flex items-center gap-2.5">
            <ControlButton
              onClick={onMute}
              label={muted ? "unmute" : "mute"}
              title={muted ? "Unmute (M)" : "Mute (M)"}
            />
            {/* Volume slider — subtle, atmospheric */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="volume-slider no-select"
              title={`Volume ${Math.round(volume * 100)}%`}
              style={{
                opacity: muted ? 0.2 : 0.5,
                background: `linear-gradient(to right, rgba(255,255,255,0.55) ${fillPct}%, rgba(255,255,255,0.14) ${fillPct}%)`,
              }}
            />
          </div>
        )}

        {/* End session */}
        <ControlButton
          onClick={onEnd}
          label="end"
          title="End session"
          faint
        />
      </div>

      {/* Fullscreen toggle — bottom right */}
      <button
        onClick={onFullscreen}
        title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
        className="no-select transition-all duration-400"
        style={{ color: "rgba(255,255,255,0.22)" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {isFullscreen ? (
            <>
              <path d="M5 1v4H1M11 1v4h4M5 15v-4H1M11 15v-4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <path d="M1 5V1h4M15 5V1h-4M1 11v4h4M15 11v4h-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
        </svg>
      </button>
    </motion.div>
  );
}

function ControlButton({
  onClick,
  label,
  title,
  faint,
}: {
  onClick: () => void;
  label: string;
  title?: string;
  faint?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="no-select transition-all duration-400 hover:opacity-100"
      style={{
        color: faint ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.45)",
        fontSize: 11,
        letterSpacing: "0.1em",
        fontWeight: 300,
      }}
    >
      {label}
    </button>
  );
}
