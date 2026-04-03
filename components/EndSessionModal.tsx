"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EndSessionModal({ open, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 70 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            className="relative glass-panel rounded-2xl px-8 py-8 max-w-xs w-full mx-4 text-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p
              className="font-light mb-2"
              style={{ color: "rgba(255,255,255,0.88)", fontSize: 16 }}
            >
              end session?
            </p>
            <p
              className="font-light mb-8"
              style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}
            >
              your progress will be saved
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl font-light transition-all duration-400"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 13,
                }}
              >
                cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl font-light transition-all duration-400"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.88)",
                  fontSize: 13,
                }}
              >
                end
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
