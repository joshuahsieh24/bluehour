"use client";

import { motion } from "framer-motion";

interface Props {
  progress: number;       // 0–1 (1 = complete)
  isUntimed: boolean;
  timeDisplay: string;    // "24:13" formatted
  task: string;
  mode: string;
  paused?: boolean;
  accentColor: string;
}

const SIZE = 240;
const STROKE = 2;
const RADIUS = (SIZE - STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusRing({
  progress,
  isUntimed,
  timeDisplay,
  task,
  mode,
  paused = false,
  accentColor,
}: Props) {
  const dashOffset = CIRCUMFERENCE * (1 - (isUntimed ? 0 : progress));

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: SIZE + 24,
          height: SIZE + 24,
          background: `radial-gradient(circle, ${accentColor}14 0%, transparent 70%)`,
          left: -12,
          top: -12,
        }}
      />

      {/* SVG ring */}
      <svg
        width={SIZE}
        height={SIZE}
        className="absolute"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
        />

        {/* Progress arc */}
        {!isUntimed && (
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={accentColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ opacity: paused ? 0.4 : 0.75 }}
            transition={{ duration: 1, ease: "linear" }}
          />
        )}

        {/* Untimed track dot */}
        {isUntimed && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={accentColor}
            strokeWidth={STROKE}
            strokeOpacity={0.2}
            strokeDasharray="4 8"
          />
        )}
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center justify-center text-center px-8" style={{ width: SIZE - 32 }}>
        {/* Task */}
        <p
          className="text-sm font-light leading-snug mb-3 line-clamp-2"
          style={{ color: "rgba(255,255,255,0.88)", letterSpacing: "0.01em" }}
          title={task}
        >
          {task || "no task set"}
        </p>

        {/* Time */}
        <motion.p
          className="font-light tabular-nums"
          style={{
            fontSize: 36,
            letterSpacing: "-0.02em",
            color: paused ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.75)",
            lineHeight: 1,
          }}
          animate={{ opacity: paused ? 0.5 : 1 }}
          transition={{ duration: 0.4 }}
        >
          {timeDisplay}
        </motion.p>

        {/* Mode label */}
        <p
          className="text-xs mt-3 tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em", fontSize: 10 }}
        >
          {paused ? "paused" : mode}
        </p>
      </div>
    </div>
  );
}
