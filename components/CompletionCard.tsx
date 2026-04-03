"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatSessionDuration } from "@/lib/storage";
import { getScene } from "@/lib/scenes";
import type { ActiveSession } from "@/lib/types";

interface Props {
  session: ActiveSession;
  elapsed: number;
  onGoAgain: () => void;
  onDone: (reflection: { completed: "yes" | "partly" | "no"; pulledAway?: string }) => void;
}

export default function CompletionCard({ session, elapsed, onGoAgain, onDone }: Props) {
  const [completed, setCompleted] = useState<"yes" | "partly" | "no" | null>(null);
  const [pulledAway, setPulledAway] = useState("");
  const scene = getScene(session.sceneId);

  const handleDone = () => {
    if (!completed) return;
    onDone({ completed, pulledAway: pulledAway.trim() || undefined });
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <motion.div
        className="glass-panel rounded-2xl px-10 py-10 max-w-sm w-full mx-4"
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        {/* Header */}
        <div className="mb-8">
          <p
            className="font-light mb-1"
            style={{ color: "rgba(255,255,255,0.88)", fontSize: 20, letterSpacing: "-0.01em" }}
          >
            {formatSessionDuration(elapsed)}
          </p>
          <p
            className="font-light"
            style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}
          >
            {session.mode} · {scene.name}
          </p>
        </div>

        {/* Task */}
        {session.task && (
          <div
            className="mb-8 pb-8"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="font-light leading-relaxed"
              style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}
            >
              {session.task}
            </p>
          </div>
        )}

        {/* Interruptions */}
        {session.interruptions > 0 && (
          <p
            className="mb-6 font-light"
            style={{ color: "rgba(255,255,255,0.28)", fontSize: 12 }}
          >
            {session.interruptions} interruption{session.interruptions !== 1 ? "s" : ""}
          </p>
        )}

        {/* Reflection: did you complete? */}
        <div className="mb-6">
          <p
            className="mb-3 font-light"
            style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: "0.04em" }}
          >
            did you complete your intention
          </p>
          <div className="flex gap-2">
            {(["yes", "partly", "no"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setCompleted(opt)}
                className="pill flex-1"
                style={{
                  ...(completed === opt
                    ? {
                        background: "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.22)",
                        color: "rgba(255,255,255,0.88)",
                      }
                    : {}),
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Reflection: what pulled you away */}
        <div className="mb-8">
          <p
            className="mb-2 font-light"
            style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: "0.04em" }}
          >
            what pulled you away
          </p>
          <input
            type="text"
            value={pulledAway}
            onChange={(e) => setPulledAway(e.target.value)}
            placeholder="nothing this time"
            className="w-full py-2 font-light text-sm"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.65)",
              fontSize: 13,
            }}
            maxLength={200}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleDone}
            disabled={!completed}
            className="w-full py-2.5 rounded-xl transition-all duration-400 font-light"
            style={{
              background: completed ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${completed ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}`,
              color: completed ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.25)",
              fontSize: 14,
              letterSpacing: "0.02em",
              cursor: completed ? "pointer" : "not-allowed",
            }}
          >
            done for now
          </button>
          <button
            onClick={onGoAgain}
            className="w-full py-2.5 font-light transition-all duration-400"
            style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}
          >
            go again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
