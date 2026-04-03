"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getHistory, clearHistory, formatSessionDuration } from "@/lib/storage";
import { getScene } from "@/lib/scenes";
import type { SessionRecord } from "@/lib/types";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function HistoryPage() {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRecords(getHistory());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    clearHistory();
    setRecords([]);
    setShowClearConfirm(false);
  };

  return (
    <div
      className="fixed inset-0 scrollable"
      style={{ background: "#0f1115" }}
    >
      {/* Grain */}
      <div className="grain-overlay" style={{ opacity: 0.022, position: "fixed" }} />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
          zIndex: 1,
        }}
      />

      <div className="relative max-w-xl mx-auto px-6 py-12" style={{ zIndex: 2 }}>
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div>
            <Link
              href="/"
              className="font-light transition-all duration-400 block mb-1"
              style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, textDecoration: "none", letterSpacing: "0.08em" }}
            >
              bluehour
            </Link>
            <h1
              className="font-light"
              style={{ color: "rgba(255,255,255,0.88)", fontSize: 22, letterSpacing: "-0.01em" }}
            >
              history
            </h1>
          </div>

          <Link
            href="/focus"
            className="pill no-select"
            style={{ textDecoration: "none" }}
          >
            focus
          </Link>
        </motion.div>

        {/* Content */}
        {loaded && (
          <>
            {records.length === 0 ? (
              <motion.div
                className="text-center py-24"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <p
                  className="font-light mb-2"
                  style={{ color: "rgba(255,255,255,0.35)", fontSize: 16 }}
                >
                  nothing here yet
                </p>
                <p
                  className="font-light"
                  style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}
                >
                  your sessions will gather here
                </p>
              </motion.div>
            ) : (
              <>
                <div className="flex flex-col gap-3 mb-10">
                  {records.map((record, i) => (
                    <SessionCard key={record.id} record={record} index={i} />
                  ))}
                </div>

                {/* Clear history */}
                {!showClearConfirm ? (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="font-light transition-all duration-400"
                      style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, letterSpacing: "0.04em" }}
                    >
                      clear history
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    className="text-center flex flex-col items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, fontWeight: 300 }}>
                      clear all sessions?
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="font-light transition-all duration-400"
                        style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}
                      >
                        cancel
                      </button>
                      <button
                        onClick={handleClear}
                        className="font-light transition-all duration-400"
                        style={{ color: "rgba(255,100,100,0.6)", fontSize: 13 }}
                      >
                        clear
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SessionCard({ record, index }: { record: SessionRecord; index: number }) {
  const scene = getScene(record.sceneId);

  const completionColor =
    record.completed === "yes"
      ? "rgba(120, 200, 140, 0.7)"
      : record.completed === "partly"
      ? "rgba(200, 170, 80, 0.7)"
      : "rgba(200, 100, 100, 0.55)";

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(23, 25, 32, 0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
    >
      {/* Accent bar */}
      <div
        style={{
          height: 2,
          background: `linear-gradient(to right, ${scene.accent}60, transparent)`,
        }}
      />

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex-1 min-w-0">
            {record.task ? (
              <p
                className="font-light mb-1 truncate"
                style={{ color: "rgba(255,255,255,0.78)", fontSize: 14 }}
              >
                {record.task}
              </p>
            ) : (
              <p
                className="font-light mb-1 italic"
                style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}
              >
                no task
              </p>
            )}
            <p
              className="font-light"
              style={{ color: "rgba(255,255,255,0.32)", fontSize: 12 }}
            >
              {record.mode} · {scene.name}
            </p>
          </div>

          {/* Right */}
          <div className="text-right flex-shrink-0">
            <p
              className="font-light mb-1"
              style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}
            >
              {formatSessionDuration(record.duration)}
            </p>
            <p
              className="font-light"
              style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}
            >
              {formatDate(record.startedAt)} · {formatTime(record.startedAt)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span
            className="font-light"
            style={{ color: completionColor, fontSize: 11, letterSpacing: "0.04em" }}
          >
            {record.completed}
          </span>
          {record.interruptions > 0 && (
            <span
              className="font-light"
              style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}
            >
              {record.interruptions} interruption{record.interruptions !== 1 ? "s" : ""}
            </span>
          )}
          {record.pulledAway && (
            <span
              className="font-light truncate"
              style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}
            >
              {record.pulledAway}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
