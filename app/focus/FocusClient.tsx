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
  saveSession,
} from "@/lib/storage";
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
    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted };
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
      return { ...state, autoplayBlocked: true };
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

export default function FocusClient() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [openFullscreenOnStart, setOpenFullscreenOnStart] = useState(true);
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

    tickRef.current = setInterval(() => {
      const elapsed = getElapsedSeconds(state.session!);
      dispatch({ type: "TICK", elapsed });

      // Check completion for timed sessions
      if (state.session!.plannedDuration !== "untimed") {
        const remaining = getRemainingSeconds(state.session!);
        if (remaining !== null && remaining <= 0) {
          dispatch({ type: "COMPLETE" });
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

  // Interruption detection
  useEffect(() => {
    if (state.phase !== "active") return;
    const handleBlur = () => dispatch({ type: "INTERRUPT" });
    document.addEventListener("visibilitychange", handleBlur);
    return () => document.removeEventListener("visibilitychange", handleBlur);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "active") return;
    const handleVis = () => {
      if (document.hidden) dispatch({ type: "INTERRUPT" });
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, [state.phase]);

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
        case "Escape":
          if (isFullscreen) toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.phase, toggleFullscreen, isFullscreen]);

  const scene = getScene(state.sceneId);

  const handleStart = () => {
    if (openFullscreenOnStart && !isFullscreen) {
      toggleFullscreen();
    }
    dispatch({ type: "START" });
  };

  const handleEndConfirmed = () => {
    dispatch({ type: "END_CONFIRMED" });
  };

  const handleDone = (reflection: { completed: "yes" | "partly" | "no"; pulledAway?: string }) => {
    if (!state.session) return;
    saveSession({
      id: state.session.id,
      startedAt: state.session.startedAt,
      endedAt: Date.now(),
      duration: state.elapsed,
      plannedDuration: state.session.plannedDuration,
      mode: state.session.mode,
      task: state.session.task,
      sceneId: state.session.sceneId,
      completed: reflection.completed,
      pulledAway: reflection.pulledAway,
      interruptions: state.session.interruptions,
    });
    dispatch({ type: "GO_AGAIN" });
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

      {/* Audio */}
      {state.session && (
        <AudioController
          scene={scene}
          muted={state.muted}
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

      {/* COMPLETE */}
      <AnimatePresence>
        {state.phase === "complete" && state.session && (
          <CompletionCard
            session={state.session}
            elapsed={state.elapsed}
            onGoAgain={() => dispatch({ type: "GO_AGAIN" })}
            onDone={handleDone}
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
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  onStart: () => void;
  openFullscreenOnStart: boolean;
  setOpenFullscreenOnStart: (v: boolean) => void;
  taskInputRef: React.RefObject<HTMLInputElement>;
}) {
  const DURATIONS: SessionDuration[] = [25, 50, "untimed"];
  const MODES: SessionMode[] = ["deep work", "writing", "reading", "coding", "reflection"];

  return (
    <motion.div
      className="fixed inset-0 flex"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Dark side panel */}
      <motion.div
        className="relative flex flex-col h-full overflow-y-auto scrollable"
        style={{
          width: 380,
          background: "rgba(10, 11, 15, 0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          zIndex: 25,
        }}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <span
            className="font-light"
            style={{ color: "rgba(255,255,255,0.88)", fontSize: 16, letterSpacing: "-0.01em" }}
          >
            bluehour
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="font-light transition-all duration-400"
              style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none", letterSpacing: "0.04em" }}
            >
              home
            </Link>
            <Link
              href="/history"
              className="font-light transition-all duration-400"
              style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none", letterSpacing: "0.04em" }}
            >
              history
            </Link>
          </div>
        </div>

        <div className="flex-1 px-8 flex flex-col gap-8 pb-8">
          {/* Scene picker */}
          <Section label="choose your space">
            <ScenePicker
              selected={state.sceneId}
              onSelect={(id) => dispatch({ type: "SET_SCENE", id })}
            />
          </Section>

          {/* Task input */}
          <Section label="what needs your attention">
            <div
              className="w-full py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              <input
                ref={taskInputRef}
                type="text"
                value={state.task}
                onChange={(e) => dispatch({ type: "SET_TASK", t: e.target.value })}
                placeholder="one thing only"
                className="w-full text-sm font-light"
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontSize: 14,
                }}
                maxLength={120}
              />
            </div>
          </Section>

          {/* Duration */}
          <Section label="how long">
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={String(d)}
                  className={`pill ${state.duration === d ? "pill-active" : ""}`}
                  onClick={() => dispatch({ type: "SET_DURATION", d })}
                >
                  {d === "untimed" ? "untimed" : `${d} min`}
                </button>
              ))}
            </div>
          </Section>

          {/* Mode */}
          <Section label="mode">
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
          <Section label="options">
            <label
              className="flex items-center gap-3 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 300 }}
            >
              <div
                onClick={() => setOpenFullscreenOnStart(!openFullscreenOnStart)}
                className="relative transition-all duration-400"
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 999,
                  background: openFullscreenOnStart
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <motion.div
                  className="absolute top-0.5 rounded-full bg-white"
                  style={{ width: 14, height: 14 }}
                  animate={{ left: openFullscreenOnStart ? 15 : 2 }}
                  transition={{ duration: 0.25 }}
                />
              </div>
              open in fullscreen on start
            </label>
          </Section>
        </div>

        {/* Start button */}
        <div className="px-8 pb-10 pt-2">
          <button
            onClick={onStart}
            className="w-full py-3.5 rounded-xl font-light transition-all duration-500"
            style={{
              background: "rgba(255,255,255,0.09)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.88)",
              fontSize: 14,
              letterSpacing: "0.06em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)";
            }}
          >
            begin
          </button>
        </div>
      </motion.div>

      {/* Right side: scene preview fills the rest */}
      <div className="flex-1 relative flex items-end justify-end p-8">
        <p
          className="font-light"
          style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, letterSpacing: "0.1em" }}
        >
          {getScene(state.sceneId).description}
        </p>
      </div>
    </motion.div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
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
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  overlayVisible: boolean;
  progress: number;
  timeDisplay: string;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
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

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
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
        onPauseResume={() =>
          dispatch({ type: isPaused ? "RESUME" : "PAUSE" })
        }
        onMute={() => dispatch({ type: "TOGGLE_MUTE" })}
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
