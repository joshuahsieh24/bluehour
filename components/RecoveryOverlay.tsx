"use client";

import { motion } from "framer-motion";
import { formatSessionDuration, getElapsedSeconds } from "@/lib/storage";
import { getScene } from "@/lib/scenes";
import type { ActiveSession } from "@/lib/types";

interface Props {
  session: ActiveSession;
  onResume: () => void;
  onStartOver: () => void;
}

export default function RecoveryOverlay({ session, onResume, onStartOver }: Props) {
  const scene = getScene(session.sceneId);
  const elapsed = getElapsedSeconds(session);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 80, background: "rgba(0,0,0,0.85)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="glass-panel rounded-2xl px-10 py-10 max-w-sm w-full mx-4 text-center"
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p
          className="font-light mb-1"
          style={{ color: "rgba(255,255,255,0.88)", fontSize: 18 }}
        >
          session in progress
        </p>
        <p
          className="font-light mb-8"
          style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}
        >
          {formatSessionDuration(elapsed)} · {scene.name}
        </p>

        {session.task && (
          <p
            className="font-light mb-8"
            style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}
          >
            {session.task}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-2.5 rounded-xl font-light transition-all duration-400"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.88)",
              fontSize: 14,
            }}
          >
            resume session
          </button>
          <button
            onClick={onStartOver}
            className="w-full py-2.5 font-light transition-all duration-400"
            style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}
          >
            start over
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
