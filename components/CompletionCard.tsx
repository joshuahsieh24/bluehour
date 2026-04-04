"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatSessionDuration } from "@/lib/storage";
import { getScene } from "@/lib/scenes";
import type { ActiveSession } from "@/lib/types";

interface Props {
  session: ActiveSession;
  elapsed: number;
  onNoteSubmit: (note: string) => void;
  onBeginAgain: () => void;
}

/**
 * Completion resting state.
 *
 * Stays on screen indefinitely after a session ends — no auto-dismiss,
 * no forced decision. The user can sit here, add an optional note, then
 * choose to begin again whenever they're ready.
 *
 * Design intent: calm acknowledgment, not a productivity checkpoint.
 */
export default function CompletionCard({ session, elapsed, onNoteSubmit, onBeginAgain }: Props) {
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const scene = getScene(session.sceneId);

  const handleSaveNote = () => {
    const trimmed = noteText.trim();
    if (trimmed) {
      onNoteSubmit(trimmed);
      setNoteSaved(true);
    }
    setShowNote(false);
    setNoteText("");
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
    >
      <motion.div
        className="flex flex-col items-center"
        style={{ maxWidth: 320, width: "100%", padding: "0 28px" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        {/* Elapsed time — primary signal */}
        <p
          className="font-light"
          style={{
            fontSize: 52,
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.90)",
            textShadow: "0 2px 32px rgba(0,0,0,0.5)",
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
            color: "rgba(255,255,255,0.28)",
          }}
        >
          {session.mode} · {scene.name}
        </p>

        {/* Task — only if set */}
        {session.task && (
          <p
            className="font-light mt-4 text-center"
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.38)",
              fontStyle: "italic",
              maxWidth: 260,
              lineHeight: 1.55,
            }}
          >
            &ldquo;{session.task}&rdquo;
          </p>
        )}

        {/* Optional note */}
        <div className="mt-7 w-full flex flex-col items-center">
          <AnimatePresence mode="wait">
            {noteSaved ? (
              <motion.p
                key="saved"
                className="font-light"
                style={{ fontSize: 11, letterSpacing: "0.08em", color: "rgba(255,255,255,0.22)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                note saved
              </motion.p>
            ) : !showNote ? (
              <motion.button
                key="add-note-btn"
                onClick={() => setShowNote(true)}
                className="font-light transition-colors duration-300"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.18)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.42)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.18)"; }}
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
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="a few words…"
                  maxLength={300}
                  rows={3}
                  className="w-full font-light resize-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.65)",
                    outline: "none",
                    lineHeight: 1.6,
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSaveNote();
                    if (e.key === "Escape") { setShowNote(false); setNoteText(""); }
                  }}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="font-light"
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em" }}
                  >
                    ⌘↵ to save
                  </span>
                  <button
                    onClick={handleSaveNote}
                    className="font-light transition-colors duration-300"
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", letterSpacing: "0.08em", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.32)"; }}
                  >
                    save
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Begin again — soft, bottom-anchored invitation */}
        <motion.button
          onClick={onBeginAgain}
          className="font-light transition-colors duration-400"
          style={{
            marginTop: 44,
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.20)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.52)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.20)"; }}
        >
          begin
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
