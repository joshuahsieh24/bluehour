"use client";

import { motion } from "framer-motion";
import { formatSessionDuration } from "@/lib/storage";
import { getScene } from "@/lib/scenes";
import type { ActiveSession } from "@/lib/types";

interface Props {
  session: ActiveSession;
  elapsed: number;
}

/**
 * Graceful session-end display.
 *
 * No buttons — this card is purely informational and auto-dismisses when the
 * parent transitions away (GO_AGAIN fires ≈1200ms after COMPLETE). It exists
 * only to give the user a calm visual moment acknowledging the session ended
 * before the sidebar slides in for the next setup.
 */
export default function CompletionCard({ session, elapsed }: Props) {
  const scene = getScene(session.sceneId);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 50, pointerEvents: "none" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    >
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
      >
        {/* Elapsed time — the only number that matters */}
        <p
          className="font-light"
          style={{
            fontSize: 52,
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.88)",
            textShadow: "0 2px 28px rgba(0,0,0,0.5)",
            lineHeight: 1,
          }}
        >
          {formatSessionDuration(elapsed)}
        </p>

        {/* Mode · scene */}
        <p
          className="font-light mt-3"
          style={{
            fontSize: 12,
            letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {session.mode} · {scene.name}
        </p>

        {/* Task — if set */}
        {session.task && (
          <p
            className="font-light mt-3 text-center"
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.42)",
              fontStyle: "italic",
              maxWidth: 280,
              lineHeight: 1.55,
            }}
          >
            &ldquo;{session.task}&rdquo;
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
