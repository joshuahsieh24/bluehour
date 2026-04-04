"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatSessionDuration } from "@/lib/storage";
import { getScene } from "@/lib/scenes";
import type { ActiveSession } from "@/lib/types";

interface Props {
  session: ActiveSession;
  elapsed: number;
  onGoAgain: () => void;
  // note is optional — if absent, session is saved with completed: "yes"
  onDone: (note?: string) => void;
}

export default function CompletionCard({ session, elapsed, onGoAgain, onDone }: Props) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const scene = getScene(session.sceneId);

  const handleDone = () => {
    onDone(note.trim() || undefined);
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
    >
      <motion.div
        className="flex flex-col items-center"
        style={{ maxWidth: 340, width: "100%", padding: "0 24px" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
      >

        {/* Time — large, primary */}
        <p
          className="font-light"
          style={{
            fontSize: 44,
            letterSpacing: "-0.03em",
            color: "rgba(255, 255, 255, 0.90)",
            textShadow: "0 2px 24px rgba(0, 0, 0, 0.5)",
            lineHeight: 1,
          }}
        >
          {formatSessionDuration(elapsed)}
        </p>

        {/* Mode · scene */}
        <p
          className="font-light mt-2"
          style={{
            fontSize: 12,
            letterSpacing: "0.06em",
            color: "rgba(255, 255, 255, 0.32)",
          }}
        >
          {session.mode} · {scene.name}
        </p>

        {/* Task */}
        {session.task && (
          <p
            className="font-light mt-4 text-center leading-relaxed"
            style={{
              fontSize: 14,
              color: "rgba(255, 255, 255, 0.52)",
              fontStyle: "italic",
              maxWidth: 280,
            }}
          >
            &ldquo;{session.task}&rdquo;
          </p>
        )}

        {/* Interruptions — only if any */}
        {session.interruptions > 0 && (
          <p
            className="font-light mt-3"
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "rgba(255, 255, 255, 0.22)",
            }}
          >
            {session.interruptions} interruption{session.interruptions !== 1 ? "s" : ""}
          </p>
        )}

        {/* Primary action */}
        <motion.button
          onClick={handleDone}
          className="font-light transition-all duration-500"
          style={{
            marginTop: 40,
            padding: "11px 52px",
            fontSize: 14,
            letterSpacing: "0.1em",
            color: "rgba(255, 255, 255, 0.84)",
            background: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 999,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          }}
          onMouseEnter={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "rgba(255, 255, 255, 0.11)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "rgba(255, 255, 255, 0.95)",
            });
          }}
          onMouseLeave={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "rgba(255, 255, 255, 0.07)",
              borderColor: "rgba(255, 255, 255, 0.12)",
              color: "rgba(255, 255, 255, 0.84)",
            });
          }}
        >
          Done
        </motion.button>

        {/* Secondary action */}
        <button
          onClick={onGoAgain}
          className="font-light mt-4 transition-all duration-400"
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            color: "rgba(255, 255, 255, 0.28)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.54)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.28)";
          }}
        >
          Start Again
        </button>

        {/* Optional note */}
        <div className="mt-6 w-full flex flex-col items-center">
          <AnimatePresence mode="wait">
            {!showNote ? (
              <motion.button
                key="add-note-btn"
                onClick={() => setShowNote(true)}
                className="font-light transition-all duration-400"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: "rgba(255, 255, 255, 0.18)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.18)";
                }}
              >
                + add a note
              </motion.button>
            ) : (
              <motion.div
                key="note-input"
                className="w-full"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <textarea
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="a few words…"
                  maxLength={300}
                  rows={3}
                  className="w-full font-light resize-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: "rgba(255, 255, 255, 0.65)",
                    outline: "none",
                    lineHeight: 1.6,
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      handleDone();
                    }
                  }}
                />
                <p
                  className="mt-1.5 font-light"
                  style={{
                    fontSize: 10,
                    color: "rgba(255, 255, 255, 0.18)",
                    letterSpacing: "0.06em",
                    textAlign: "right",
                  }}
                >
                  ⌘↵ to finish
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
