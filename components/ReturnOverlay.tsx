"use client";

import { motion } from "framer-motion";

interface Props {
  onContinue: () => void;
  onEnd: () => void;
}

export default function ReturnOverlay({ onContinue, onEnd }: Props) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 60 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        className="relative glass-panel rounded-2xl px-10 py-10 text-center max-w-xs w-full mx-4"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p
          className="font-light mb-1"
          style={{ color: "rgba(255,255,255,0.88)", fontSize: 18, letterSpacing: "-0.01em" }}
        >
          welcome back
        </p>
        <p
          className="font-light mb-8"
          style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}
        >
          ready to continue
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full py-2.5 rounded-xl transition-all duration-400 font-light"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.88)",
              fontSize: 14,
              letterSpacing: "0.02em",
            }}
          >
            continue
          </button>
          <button
            onClick={onEnd}
            className="w-full py-2.5 rounded-xl transition-all duration-400 font-light"
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 13,
            }}
          >
            end session
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
