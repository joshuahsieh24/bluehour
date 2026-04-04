"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import type {
  FocusState,
  SceneId,
  SessionDuration,
  SessionMode,
  OverlayMode,
  ActiveSession,
} from "@/lib/types";
import {
  getPrefs,
  savePrefs,
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  createActiveSession,
  getElapsedSeconds,
  getRemainingSeconds,
  formatDuration,
  formatSessionDuration,
  saveSession,
  updateSessionNote,
} from "@/lib/storage";
import { playCompletionChime, playCountdownCue } from "@/lib/completionChime";
import { getScene } from "@/lib/scenes";

import SceneBackground from "@/components/SceneBackground";
import ScenePicker from "@/components/ScenePicker";
import FocusRing from "@/components/FocusRing";
import OverlayControls from "@/components/OverlayControls";
import ReturnOverlay from "@/components/ReturnOverlay";
import CompletionCard from "@/components/CompletionCard";
import EndSessionModal from "@/components/EndSessionModal";
import RecoveryOverlay from "@/components/RecoveryOverlay";
import AudioController from "@/components/AudioController";
import { useFullscreen } from "@/components/FullscreenToggle";

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  phase: FocusState;
  session: ActiveSession | null;
  sceneId: SceneId;
  duration: SessionDuration;
  mode: SessionMode;
  task: string;
  muted: boolean;
  volume: number;
  overlayMode: OverlayMode;
  recoverySession: ActiveSession | null;
  autoplayBlocked: boolean;
  showEndModal: boolean;
  elapsed: number;
}

type Action =
  | { type: "INIT"; prefs: ReturnType<typeof getPrefs>; recovery: ActiveSession | null }
  | { type: "SET_SCENE"; id: SceneId }
  | { type: "SET_DURATION"; d: SessionDuration }
  | { type: "SET_MODE"; m: SessionMode }
  | { type: "SET_TASK"; t: string }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "INTERRUPT" }
  | { type: "RETURN" }
  | { type: "COMPLETE" }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_VOLUME"; v: number }
  | { type: "SET_OVERLAY_MODE"; m: OverlayMode }
  | { type: "SHOW_END_MODAL"; show: boolean }
  | { type: "END_CONFIRMED" }
  | { type: "RESUME_RECOVERY" }
  | { type: "DISCARD_RECOVERY" }
  | { type: "AUTOPLAY_BLOCKED" }
  | { type: "TICK"; elapsed: number }
  | { type: "GO_AGAIN" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT": {
      const { prefs, recovery } = action;
      return {
        ...state,
        sceneId: prefs.lastSceneId,
        duration: prefs.lastDuration,
        mode: prefs.lastMode,
        muted: prefs.muted,
        volume: prefs.volume,
        overlayMode: prefs.overlayMode,
        recoverySession: recovery,
        phase: recovery ? "pre-session" : "pre-session",
      };
    }
    case "SET_SCENE":
      return { ...state, sceneId: action.id };
    case "SET_DURATION":
      return { ...state, duration: action.d };
    case "SET_MODE":
      return { ...state, mode: action.m };
    case "SET_TASK":
      return { ...state, task: action.t };
    case "START": {
      const session = createActiveSession({
        sceneId: state.sceneId,
        task: state.task,
        plannedDuration: state.duration,
        mode: state.mode,
      });
      return { ...state, phase: "active", session, elapsed: 0 };
    }
    case "PAUSE": {
      if (!state.session) return state;
      const session = { ...state.session, pausedAt: Date.now() };
      return { ...state, phase: "paused", session };
    }
    case "RESUME": {
      if (!state.session || !state.session.pausedAt) return state;
      const additionalPaused = Date.now() - state.session.pausedAt;
      const session = {
        ...state.session,
        pausedAt: undefined,
        totalPausedMs: state.session.totalPausedMs + additionalPaused,
      };
      return { ...state, phase: "active", session };
    }
    case "INTERRUPT": {
      if (!state.session || state.phase !== "active") return state;
      const session = {
        ...state.session,
        pausedAt: Date.now(),
        interruptions: state.session.interruptions + 1,
      };
      return { ...state, phase: "interrupted", session };
    }
    case "RETURN": {
      return { ...state, phase: "active", session: state.session ? {
        ...state.session,
        pausedAt: undefined,
        totalPausedMs: state.session.totalPausedMs + (state.session.pausedAt ? Date.now() - state.session.pausedAt : 0),
      } : null };
    }
    case "COMPLETE":
      return { ...state, phase: "complete" };
    case "TOGGLE_MUTE": {
      const newMuted = !state.muted;
      return {
        ...state,
        muted: newMuted,
        // Clear the autoplay block once the user unmutes so the banner hides
        autoplayBlocked: newMuted ? state.autoplayBlocked : false,
      };
    }
    case "SET_VOLUME":
      return { ...state, volume: action.v };
    case "SET_OVERLAY_MODE":
      return { ...state, overlayMode: action.m };
    case "SHOW_END_MODAL":
      return { ...state, showEndModal: action.show };
    case "END_CONFIRMED":
      return { ...state, phase: "complete", showEndModal: false };
    case "RESUME_RECOVERY": {
      const s = state.recoverySession!;
      // Adjust for the reload gap
      const gap = Date.now() - (s.pausedAt ?? Date.now());
      const session = {
        ...s,
        pausedAt: undefined,
        totalPausedMs: s.totalPausedMs + gap,
      };
      return { ...state, phase: "active", session, recoverySession: null };
    }
    case "DISCARD_RECOVERY":
      return { ...state, recoverySession: null };
    case "AUTOPLAY_BLOCKED":
      // Also mute state so TOGGLE_MUTE can flip it back to false,
      // which triggers AudioController's re-play attempt
      return { ...state, autoplayBlocked: true, muted: true };
    case "TICK":
      return { ...state, elapsed: action.elapsed };
    case "GO_AGAIN":
      return {
        ...state,
        phase: "pre-session",
        session: null,
        elapsed: 0,
        task: "",
      };
    default:
      return state;
  }
}

const INITIAL_STATE: State = {
  phase: "pre-session",
  session: null,
  sceneId: "rainy-cafe",
  duration: 25,
  mode: "deep work",
  task: "",
  muted: false,
  volume: 0.6,
  overlayMode: "minimal",
  recoverySession: null,
  autoplayBlocked: false,
  showEndModal: false,
  elapsed: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CompletionSummary {
  id: string;
  elapsed: number;
  task: string;
  mode: SessionMode;
  sceneId: SceneId;
  interruptions: number;
}

export default function FocusClient() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownCueFiredRef = useRef(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [openFullscreenOnStart, setOpenFullscreenOnStart] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary | null>(null);
  const taskInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  // Init from localStorage
  useEffect(() => {
    const prefs = getPrefs();
    const recovery = getActiveSession();
    dispatch({ type: "INIT", prefs, recovery });
  }, []);

  // Persist prefs on change
  useEffect(() => {
    savePrefs({
      lastSceneId: state.sceneId,
      lastDuration: state.duration,
      lastMode: state.mode,
      muted: state.muted,
      overlayMode: state.overlayMode,
      volume: state.volume,
    });
  }, [state.sceneId, state.duration, state.mode, state.muted, state.overlayMode, state.volume]);

  // Timer tick
  useEffect(() => {
    if (state.phase !== "active" || !state.session) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }

    // Reset the countdown cue flag for each new active window (new session or resume)
    countdownCueFiredRef.current = false;

    tickRef.current = setInterval(() => {
      const elapsed = getElapsedSeconds(state.session!);
      dispatch({ type: "TICK", elapsed });

      if (state.session!.plannedDuration !== "untimed") {
        const remaining = getRemainingSeconds(state.session!);
        if (remaining !== null) {
          // Soft single-tone cue at 3 seconds remaining — fires once per session window
          if (remaining === 3 && !countdownCueFiredRef.current) {
            countdownCueFiredRef.current = true;
            playCountdownCue();
          }
          if (remaining <= 0) {
            dispatch({ type: "COMPLETE" });
          }
        }
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.session?.id]);

  // Persist active session
  useEffect(() => {
    if (state.phase === "active" || state.phase === "paused" || state.phase === "interrupted") {
      if (state.session) saveActiveSession(state.session);
    } else if (state.phase === "complete" || state.phase === "pre-session") {
      clearActiveSession();
    }
  }, [state.phase, state.session]);

  // Intentionally no auto-interrupt on visibility change.
  // The timer runs continuously — pausing is always an explicit user action.
  // Navigation or tab switches are not treated as interruptions.

  // Warn before unload during active session
  useEffect(() => {
    if (state.phase === "active" || state.phase === "paused") {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "";
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
  }, [state.phase]);

  // Idle overlay behavior
  useEffect(() => {
    if (state.phase !== "active") {
      setOverlayVisible(true);
      return;
    }

    const show = () => {
      setOverlayVisible(true);
      if (idleRef.current) clearTimeout(idleRef.current);
      idleRef.current = setTimeout(() => {
        if (state.overlayMode === "ambient") setOverlayVisible(false);
        else if (state.overlayMode === "minimal") setOverlayVisible(false);
      }, 4000);
    };

    window.addEventListener("pointermove", show);
    window.addEventListener("pointerdown", show);
    window.addEventListener("keydown", show);

    show();

    return () => {
      window.removeEventListener("pointermove", show);
      window.removeEventListener("pointerdown", show);
      window.removeEventListener("keydown", show);
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, [state.phase, state.overlayMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (state.phase === "active") dispatch({ type: "PAUSE" });
          else if (state.phase === "paused") dispatch({ type: "RESUME" });
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "m":
        case "M":
          dispatch({ type: "TOGGLE_MUTE" });
          break;
        case "s":
        case "S":
          setSidebarOpen((v) => !v);
          break;
        case "Escape":
          if (isFullscreen) toggleFullscreen();
          else if (sidebarOpen && state.phase === "active") setSidebarOpen(false);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.phase, toggleFullscreen, isFullscreen, sidebarOpen]);

  const scene = getScene(state.sceneId);

  // Pause = controls return; resume = controls recede
  useEffect(() => {
    if (state.phase === "paused") {
      setSidebarOpen(true);
    } else if (state.phase === "active") {
      setSidebarOpen(false);
    }
  }, [state.phase]);

  // On completion: save session, store summary, play chime.
  // No auto-transition — the completion state rests on screen until the user acts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.phase !== "complete" || !state.session) return;

    const session = state.session;
    const elapsed = getElapsedSeconds(session);

    playCompletionChime();

    saveSession({
      id: session.id,
      startedAt: session.startedAt,
      endedAt: Date.now(),
      duration: elapsed,
      plannedDuration: session.plannedDuration,
      mode: session.mode,
      task: session.task,
      sceneId: session.sceneId,
      completed: "yes",
      interruptions: session.interruptions,
    });

    setCompletionSummary({
      id: session.id,
      elapsed,
      task: session.task,
      mode: session.mode,
      sceneId: session.sceneId,
      interruptions: session.interruptions,
    });
  }, [state.phase]);

  // Called from CompletionCard — transitions out of the resting completion state
  const handleBeginAgain = () => {
    dispatch({ type: "GO_AGAIN" });
    setSidebarOpen(true);
    // completionSummary is intentionally kept so the sidebar banner shows it briefly
  };

  const handleStart = () => {
    if (openFullscreenOnStart && !isFullscreen) {
      toggleFullscreen();
    }
    setSidebarOpen(false);
    setCompletionSummary(null);
    dispatch({ type: "START" });
  };

  const handleEndConfirmed = () => {
    dispatch({ type: "END_CONFIRMED" });
  };

  const remaining = state.session ? getRemainingSeconds(state.session) : null;
  const progress =
    state.session && state.session.plannedDuration !== "untimed" && typeof state.session.plannedDuration === "number"
      ? 1 - (remaining ?? 0) / (state.session.plannedDuration * 60)
      : 0;

  const timeDisplay =
    state.session?.plannedDuration === "untimed"
      ? formatDuration(state.elapsed)
      : formatDuration(remaining ?? 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 overflow-hidden no-select" style={{ background: "#0f1115" }}>
      {/* Scene background */}
      <SceneBackground
        scene={scene}
        paused={state.phase === "paused"}
        dimmed={state.phase === "complete"}
      />

      {/* Audio — muted prop combines user mute AND session-paused state
          so audio naturally pauses/resumes in sync with the timer       */}
      {state.session && (
        <AudioController
          scene={scene}
          muted={state.muted || state.phase === "paused"}
          volume={state.volume}
          active={state.phase === "active" || state.phase === "paused"}
          onAutoplayBlocked={() => dispatch({ type: "AUTOPLAY_BLOCKED" })}
        />
      )}

      {/* Recovery overlay */}
      <AnimatePresence>
        {state.recoverySession && state.phase === "pre-session" && (
          <RecoveryOverlay
            session={state.recoverySession}
            onResume={() => dispatch({ type: "RESUME_RECOVERY" })}
            onStartOver={() => dispatch({ type: "DISCARD_RECOVERY" })}
          />
        )}
      </AnimatePresence>

      {/* PRE-SESSION */}
      <AnimatePresence>
        {state.phase === "pre-session" && !state.recoverySession && (
          <PreSession
            state={state}
            dispatch={dispatch}
            onStart={handleStart}
            openFullscreenOnStart={openFullscreenOnStart}
            setOpenFullscreenOnStart={setOpenFullscreenOnStart}
            taskInputRef={taskInputRef}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            completionSummary={completionSummary}
          />
        )}
      </AnimatePresence>

      {/* ACTIVE / PAUSED */}
      <AnimatePresence>
        {(state.phase === "active" || state.phase === "paused") && (
          <ActiveSession
            state={state}
            dispatch={dispatch}
            overlayVisible={overlayVisible}
            progress={progress}
            timeDisplay={timeDisplay}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}
      </AnimatePresence>

      {/* INTERRUPTED */}
      <AnimatePresence>
        {state.phase === "interrupted" && (
          <ReturnOverlay
            onContinue={() => dispatch({ type: "RETURN" })}
            onEnd={() => dispatch({ type: "END_CONFIRMED" })}
          />
        )}
      </AnimatePresence>

      {/* COMPLETE — resting state, stays until user acts */}
      <AnimatePresence>
        {state.phase === "complete" && state.session && (
          <CompletionCard
            session={state.session}
            elapsed={state.elapsed}
            onNoteSubmit={(note) => updateSessionNote(state.session!.id, note)}
            onBeginAgain={handleBeginAgain}
          />
        )}
      </AnimatePresence>

      {/* End session modal */}
      <EndSessionModal
        open={state.showEndModal}
        onConfirm={handleEndConfirmed}
        onCancel={() => dispatch({ type: "SHOW_END_MODAL", show: false })}
      />

      {/* Autoplay blocked notice */}
      <AnimatePresence>
        {state.autoplayBlocked && state.phase === "active" && (
          <motion.div
            className="fixed bottom-20 left-1/2 -translate-x-1/2"
            style={{ zIndex: 40 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={() => dispatch({ type: "TOGGLE_MUTE" })}
              className="glass-panel-light px-4 py-2 rounded-full text-xs font-light"
              style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}
            >
              start audio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pre-Session Panel ─────────────────────────────────────────────────────────

function PreSession({
  state,
  dispatch,
  onStart,
  openFullscreenOnStart,
  setOpenFullscreenOnStart,
  taskInputRef,
  sidebarOpen,
  setSidebarOpen,
  completionSummary,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  onStart: () => void;
  openFullscreenOnStart: boolean;
  setOpenFullscreenOnStart: (v: boolean) => void;
  taskInputRef: React.RefObject<HTMLInputElement>;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  completionSummary: CompletionSummary | null;
}) {
  const PRESET_DURATIONS = [25, 50, "untimed"] as const;
  const MODES: SessionMode[] = ["deep work", "writing", "reading", "coding", "reflection"];

  // Custom duration state
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal] = useState(() => {
    // Pre-fill with current custom value if one is active
    const d = state.duration;
    return typeof d === "number" && d !== 25 && d !== 50 ? String(d) : "60";
  });
  const customInputRef = useRef<HTMLInputElement>(null);

  const isCustomActive =
    typeof state.duration === "number" && state.duration !== 25 && state.duration !== 50;

  const applyCustom = () => {
    const v = parseInt(customVal, 10);
    if (v > 0 && v <= 600) {
      dispatch({ type: "SET_DURATION", d: v });
    }
    setShowCustom(false);
  };

  return (
    <motion.div
      className="fixed inset-0 flex"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Sidebar toggle tab — sits outside the panel, stays visible when collapsed */}
      <motion.button
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? "Collapse sidebar (S)" : "Open sidebar (S)"}
        className="fixed top-1/2 -translate-y-1/2 no-select"
        animate={{ left: sidebarOpen ? 332 : 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 16,
          height: 52,
          background: "rgba(6, 7, 11, 0.54)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "0 7px 7px 0",
          border: "1px solid rgba(255,255,255,0.06)",
          borderLeft: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.32)",
          fontSize: 11,
          cursor: "pointer",
          zIndex: 30,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.32)"; }}
      >
        {sidebarOpen ? "‹" : "›"}
      </motion.button>

      {/* Floating side panel */}
      <motion.div
        className="relative flex flex-col h-full overflow-y-auto scrollable"
        style={{
          width: 348,
          flexShrink: 0,
          background: "rgba(6, 7, 11, 0.48)",
          backdropFilter: "blur(28px) saturate(1.15)",
          WebkitBackdropFilter: "blur(28px) saturate(1.15)",
          borderRight: "1px solid rgba(255,255,255,0.032)",
          boxShadow: "4px 0 48px rgba(0,0,0,0.22)",
          zIndex: 25,
        }}
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: sidebarOpen ? 0 : -348, opacity: 1 }}
        exit={{ x: -16, opacity: 0 }}
        transition={{
          x: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.55 },
        }}
      >
        {/* Subtle top-to-mid gradient to soften the panel feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.015) 0%, transparent 30%)",
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-7 pt-8 pb-5">
          <span
            className="font-light"
            style={{ color: "rgba(255,255,255,0.78)", fontSize: 15, letterSpacing: "-0.01em" }}
          >
            bluehour
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="font-light transition-all duration-400"
              style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textDecoration: "none", letterSpacing: "0.05em" }}
            >
              home
            </Link>
            <Link
              href="/history"
              className="font-light transition-all duration-400"
              style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textDecoration: "none", letterSpacing: "0.05em" }}
            >
              history
            </Link>
          </div>
        </div>

        <div className="relative flex-1 px-7 flex flex-col pb-2">

          {/* Completion summary — shown after a session ends, until new session starts */}
          <AnimatePresence>
            {completionSummary && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="rounded-xl px-4 py-4 mb-8"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Elapsed time */}
                <p
                  className="font-light"
                  style={{
                    fontSize: 28,
                    letterSpacing: "-0.03em",
                    color: "rgba(255,255,255,0.88)",
                    lineHeight: 1,
                  }}
                >
                  {formatSessionDuration(completionSummary.elapsed)}
                </p>
                {/* Mode · scene */}
                <p
                  className="font-light mt-1.5"
                  style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}
                >
                  {completionSummary.mode} · {getScene(completionSummary.sceneId).name}
                </p>
                {/* Task */}
                {completionSummary.task && (
                  <p
                    className="font-light mt-2"
                    style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", fontStyle: "italic", lineHeight: 1.5 }}
                  >
                    &ldquo;{completionSummary.task}&rdquo;
                  </p>
                )}
                {/* Note was handled in the completion screen — banner is read-only context */}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scene picker */}
          <Section label="choose your space">
            <ScenePicker
              selected={state.sceneId}
              onSelect={(id) => dispatch({ type: "SET_SCENE", id })}
            />
          </Section>

          {/* Task input */}
          <Section label="what needs your attention" className="mt-7">
            <div
              className="w-full py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <input
                ref={taskInputRef}
                type="text"
                value={state.task}
                onChange={(e) => dispatch({ type: "SET_TASK", t: e.target.value })}
                placeholder="one thing only"
                className="w-full font-light"
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 14,
                }}
                maxLength={120}
              />
            </div>
          </Section>

          {/* Duration */}
          <Section label="how long" className="mt-6">
            <div className="flex flex-wrap gap-2">
              {PRESET_DURATIONS.map((d) => (
                <button
                  key={String(d)}
                  className={`pill ${state.duration === d ? "pill-active" : ""}`}
                  onClick={() => {
                    dispatch({ type: "SET_DURATION", d });
                    setShowCustom(false);
                  }}
                >
                  {d === "untimed" ? "untimed" : `${d} min`}
                </button>
              ))}

              {/* Custom pill */}
              <button
                className={`pill ${isCustomActive || showCustom ? "pill-active" : ""}`}
                onClick={() => {
                  if (showCustom) {
                    applyCustom();
                  } else {
                    if (isCustomActive) setCustomVal(String(state.duration));
                    setShowCustom(true);
                    // Focus the input on next paint
                    setTimeout(() => customInputRef.current?.focus(), 40);
                  }
                }}
              >
                {isCustomActive && !showCustom ? `${state.duration} min` : "custom…"}
              </button>
            </div>

            {/* Inline custom input */}
            {showCustom && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  ref={customInputRef}
                  type="number"
                  min="1"
                  max="600"
                  value={customVal}
                  onChange={(e) => setCustomVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyCustom();
                    if (e.key === "Escape") setShowCustom(false);
                  }}
                  onBlur={applyCustom}
                  className="font-light"
                  style={{
                    width: 52,
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.14)",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: 14,
                    textAlign: "center",
                    padding: "2px 4px",
                    outline: "none",
                    MozAppearance: "textfield",
                  }}
                />
                <span
                  className="font-light"
                  style={{ color: "rgba(255,255,255,0.28)", fontSize: 12 }}
                >
                  min
                </span>
              </div>
            )}
          </Section>

          {/* Mode */}
          <Section label="mode" className="mt-6">
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => (
                <button
                  key={m}
                  className={`pill ${state.mode === m ? "pill-active" : ""}`}
                  onClick={() => dispatch({ type: "SET_MODE", m })}
                >
                  {m}
                </button>
              ))}
            </div>
          </Section>

          {/* Fullscreen toggle */}
          <Section label="options" className="mt-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, fontWeight: 300 }}
              onClick={() => setOpenFullscreenOnStart(!openFullscreenOnStart)}
            >
              <div
                className="relative flex-shrink-0 transition-all duration-400"
                style={{
                  width: 30,
                  height: 17,
                  borderRadius: 999,
                  background: openFullscreenOnStart
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <motion.div
                  className="absolute top-0.5 rounded-full bg-white"
                  style={{ width: 13, height: 13 }}
                  animate={{ left: openFullscreenOnStart ? 14 : 2 }}
                  transition={{ duration: 0.22 }}
                />
              </div>
              open in fullscreen on start
            </div>
          </Section>
        </div>

        {/* Start button — pinned to bottom */}
        <div className="relative px-7 pb-7 pt-5">
          <button
            onClick={onStart}
            className="w-full py-3.5 rounded-xl font-light transition-all duration-500"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.11)",
              color: "rgba(255,255,255,0.82)",
              fontSize: 13,
              letterSpacing: "0.07em",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(255,255,255,0.12)";
              el.style.borderColor = "rgba(255,255,255,0.2)";
              el.style.color = "rgba(255,255,255,0.92)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(255,255,255,0.07)";
              el.style.borderColor = "rgba(255,255,255,0.11)";
              el.style.color = "rgba(255,255,255,0.82)";
            }}
          >
            begin
          </button>
        </div>
      </motion.div>

      {/* Right side: scene preview — scene description lower right */}
      <div className="flex-1 relative flex flex-col items-end justify-end p-8">
        <motion.div
          key={state.sceneId}
          className="text-right"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p
            className="font-light"
            style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, letterSpacing: "0.08em" }}
          >
            {getScene(state.sceneId).tagline}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Section({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p
        className="mb-3 font-light tracking-widest uppercase"
        style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, letterSpacing: "0.12em" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── Active Session Overlay ───────────────────────────────────────────────────

function ActiveSession({
  state,
  dispatch,
  overlayVisible,
  progress,
  timeDisplay,
  onToggleFullscreen,
  isFullscreen,
  sidebarOpen,
  setSidebarOpen,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  overlayVisible: boolean;
  progress: number;
  timeDisplay: string;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const scene = getScene(state.sceneId);
  const isPaused = state.phase === "paused";

  // Overlay visibility driven by mode + idle
  const shouldShowOverlay =
    state.overlayMode === "focus"
      ? true
      : state.overlayMode === "minimal"
      ? overlayVisible
      : overlayVisible; // ambient: only on hover/move

  const PANEL_W = 280;

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* ── Scene sidebar — slide in from left during active session ────────── */}
      {/* Toggle tab — always visible, slides with the panel */}
      <motion.button
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? "Hide scenes (S)" : "Change scene (S)"}
        className="fixed top-1/2 -translate-y-1/2 no-select"
        animate={{ left: sidebarOpen ? PANEL_W - 1 : 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 16,
          height: 52,
          background: "rgba(6, 7, 11, 0.54)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "0 7px 7px 0",
          border: "1px solid rgba(255,255,255,0.06)",
          borderLeft: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.28)",
          fontSize: 11,
          cursor: "pointer",
          zIndex: 32,
          pointerEvents: overlayVisible || sidebarOpen ? "auto" : "none",
          opacity: overlayVisible || sidebarOpen ? 1 : 0,
          transition: "opacity 0.5s ease, color 0.2s ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)"; }}
      >
        {sidebarOpen ? "‹" : "›"}
      </motion.button>

      {/* Slide-in panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed top-0 bottom-0 left-0 flex flex-col overflow-hidden"
            style={{
              width: PANEL_W,
              background: "rgba(5, 6, 9, 0.58)",
              backdropFilter: "blur(28px) saturate(1.1)",
              WebkitBackdropFilter: "blur(28px) saturate(1.1)",
              borderRight: "1px solid rgba(255,255,255,0.04)",
              boxShadow: "4px 0 40px rgba(0,0,0,0.28)",
              zIndex: 31,
            }}
            initial={{ x: -PANEL_W }}
            animate={{ x: 0 }}
            exit={{ x: -PANEL_W }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header — shows current scene, close tab */}
            <div className="flex items-center justify-between px-5 pt-6 pb-3 flex-shrink-0">
              <span
                className="font-light"
                style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", letterSpacing: "0.02em" }}
              >
                {scene.name}
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="font-light transition-all duration-300"
                style={{ fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; }}
              >
                esc
              </button>
            </div>

            {/* Scene picker */}
            <div className="flex-1 overflow-y-auto scrollable px-3 py-4">
              <ScenePicker
                selected={state.sceneId}
                onSelect={(id) => {
                  dispatch({ type: "SET_SCENE", id });
                  setSidebarOpen(false);
                }}
              />
            </div>

            {/* Current session info */}
            <div
              className="flex-shrink-0 px-5 py-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {state.session?.task ? (
                <p
                  className="font-light leading-relaxed"
                  style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", fontStyle: "italic" }}
                >
                  &ldquo;{state.session.task}&rdquo;
                </p>
              ) : (
                <p
                  className="font-light"
                  style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em" }}
                >
                  {state.session?.mode ?? "focus"}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center overlay */}
      <motion.div
        className="flex flex-col items-center"
        animate={{
          opacity: state.overlayMode === "ambient" && !overlayVisible ? 0 : 1,
        }}
        transition={{ duration: 0.6 }}
      >
        <FocusRing
          progress={progress}
          isUntimed={state.session?.plannedDuration === "untimed"}
          timeDisplay={timeDisplay}
          task={state.session?.task ?? ""}
          mode={state.session?.mode ?? "deep work"}
          paused={isPaused}
          accentColor={scene.accent}
        />

        {/* Overlay mode switcher — subtle dots */}
        <div className="flex gap-2.5 mt-10">
          {(["focus", "minimal", "ambient"] as OverlayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => dispatch({ type: "SET_OVERLAY_MODE", m })}
              className="transition-all duration-400"
              title={m}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: state.overlayMode === m
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom controls */}
      <OverlayControls
        scene={scene}
        paused={isPaused}
        muted={state.muted}
        volume={state.volume}
        onPauseResume={() =>
          dispatch({ type: isPaused ? "RESUME" : "PAUSE" })
        }
        onMute={() => dispatch({ type: "TOGGLE_MUTE" })}
        onVolumeChange={(v) => dispatch({ type: "SET_VOLUME", v })}
        onEnd={() => dispatch({ type: "SHOW_END_MODAL", show: true })}
        onFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
        visible={shouldShowOverlay}
      />

      {/* Paused label */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            className="fixed top-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <span
              className="font-light"
              style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, letterSpacing: "0.12em" }}
            >
              paused · press space to resume
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
