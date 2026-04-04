import type {
  SessionRecord,
  ActiveSession,
  AppPreferences,
  SceneId,
  SessionDuration,
  SessionMode,
} from "./types";

const KEYS = {
  history: "bh_history",
  active: "bh_active_session",
  prefs: "bh_prefs",
} as const;

// ─── Preferences ────────────────────────────────────────────────────────────

const DEFAULT_PREFS: AppPreferences = {
  lastSceneId: "rainy-cafe",
  lastDuration: 25,
  lastMode: "deep work",
  muted: false,
  overlayMode: "minimal",
  volume: 0.6,
};

export function getPrefs(): AppPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(KEYS.prefs);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(patch: Partial<AppPreferences>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getPrefs();
    localStorage.setItem(KEYS.prefs, JSON.stringify({ ...current, ...patch }));
  } catch {/* ignore */}
}

// ─── Active session ──────────────────────────────────────────────────────────

export function getActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEYS.active);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSession;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.active, JSON.stringify(session));
  } catch {/* ignore */}
}

export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEYS.active);
  } catch {/* ignore */}
}

// ─── History ─────────────────────────────────────────────────────────────────

export function getHistory(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.history);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

export function saveSession(record: SessionRecord): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    history.unshift(record);
    // Keep last 200 sessions
    localStorage.setItem(KEYS.history, JSON.stringify(history.slice(0, 200)));
  } catch {/* ignore */}
}

export function updateSessionNote(id: string, note: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    const idx = history.findIndex((s) => s.id === id);
    if (idx !== -1) {
      history[idx] = { ...history[idx], pulledAway: note };
      localStorage.setItem(KEYS.history, JSON.stringify(history));
    }
  } catch {/* ignore */}
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEYS.history);
  } catch {/* ignore */}
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export function createActiveSession(opts: {
  sceneId: SceneId;
  task: string;
  plannedDuration: SessionDuration;
  mode: SessionMode;
}): ActiveSession {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    startedAt: Date.now(),
    totalPausedMs: 0,
    interruptions: 0,
    ...opts,
  };
}

export function getElapsedSeconds(session: ActiveSession, now = Date.now()): number {
  const pausedAt = session.pausedAt ?? now;
  const activeMs = pausedAt - session.startedAt - session.totalPausedMs;
  return Math.max(0, Math.floor(activeMs / 1000));
}

export function getRemainingSeconds(session: ActiveSession, now = Date.now()): number | null {
  if (session.plannedDuration === "untimed") return null;
  const elapsed = getElapsedSeconds(session, now);
  return Math.max(0, session.plannedDuration * 60 - elapsed);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatSessionDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}
