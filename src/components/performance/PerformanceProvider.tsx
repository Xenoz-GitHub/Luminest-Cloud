"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PerformanceMonitor,
  type PerfEvaluation,
  type PerfLevel,
} from "@/lib/performance/monitor";

export type PerfMode = "normal" | "lite";

export const PERF_STORAGE = {
  mode: "luminest-perf-mode",
  auto: "luminest-perf-auto",
  dismissed: "luminest-perf-dismissed",
} as const;

export type PerfSuggestion = "suggest" | "auto";

interface PerformanceContextValue {
  /** Current effective mode. */
  mode: PerfMode;
  /** True when Performance Mode is active. */
  lite: boolean;
  /** Latest measurement, or null before the first evaluation. */
  evaluation: PerfEvaluation | null;
  level: PerfLevel;
  /** Which browser APIs are contributing data. */
  sources: string[];
  autoOptimize: boolean;
  setAutoOptimize: (value: boolean) => void;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  suggestion: PerfSuggestion | null;
  dismissSuggestion: () => void;
  dismissAndSuppress: () => void;
  /** Whether the user has permanently dismissed performance nagging. */
  suppressed: boolean;
  /** Allow the suggestion again after suppression. */
  resetSuppression: () => void;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

/** Consecutive bad windows required before we interrupt the user. */
const BAD_STREAK_THRESHOLD = 2;
/** Give the page time to settle before measuring at all. */
const MONITOR_START_DELAY_MS = 6000;

function applyMode(mode: PerfMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(
    "data-perf",
    mode === "lite" ? "lite" : "normal"
  );
}

export function PerformanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<PerfMode>("normal");
  const [autoOptimize, setAutoOptimizeState] = useState(false);
  const [evaluation, setEvaluation] = useState<PerfEvaluation | null>(null);
  const [suggestion, setSuggestion] = useState<PerfSuggestion | null>(null);
  const [suppressed, setSuppressed] = useState(false);
  const [ready, setReady] = useState(false);

  const badStreak = useRef(0);
  // Mirrors of reactive state so the monitoring callback never reads a stale
  // closure. Updated in effects below.
  const modeRef = useRef<PerfMode>("normal");
  const autoRef = useRef(false);
  const suppressedRef = useRef(false);

  // Hydrate preferences. Runs once on the client; the inline boot script has
  // already applied the correct data-perf attribute before first paint.
  useEffect(() => {
    try {
      const storedMode = localStorage.getItem(PERF_STORAGE.mode);
      const storedAuto = localStorage.getItem(PERF_STORAGE.auto);
      const storedDismissed = localStorage.getItem(PERF_STORAGE.dismissed);
      const initialMode: PerfMode = storedMode === "lite" ? "lite" : "normal";
      setMode(initialMode);
      modeRef.current = initialMode;
      const initialAuto = storedAuto === "1";
      setAutoOptimizeState(initialAuto);
      autoRef.current = initialAuto;
      const initialSuppressed = storedDismissed === "1";
      setSuppressed(initialSuppressed);
      suppressedRef.current = initialSuppressed;
    } catch {
      // Private mode or blocked storage: defaults are fine.
    }
    setReady(true);
  }, []);

  // Persist and reflect the mode on <html>.
  useEffect(() => {
    if (!ready) return;
    modeRef.current = mode;
    applyMode(mode);
    try {
      localStorage.setItem(PERF_STORAGE.mode, mode);
    } catch {
      // Ignore storage failures.
    }
  }, [mode, ready]);

  useEffect(() => {
    autoRef.current = autoOptimize;
  }, [autoOptimize]);

  useEffect(() => {
    suppressedRef.current = suppressed;
  }, [suppressed]);

  // Start monitoring once, after the page has had time to settle.
  useEffect(() => {
    if (!ready) return;

    const monitor = new PerformanceMonitor();
    let cancelled = false;

    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      monitor.start((result) => {
        if (cancelled) return;
        setEvaluation(result);

        const struggling =
          result.level === "degraded" || result.level === "critical";
        badStreak.current = struggling ? badStreak.current + 1 : 0;

        if (!struggling) return;
        if (badStreak.current < BAD_STREAK_THRESHOLD) return;
        if (modeRef.current === "lite") return;
        if (suppressedRef.current) return;

        if (autoRef.current) {
          // Reversible: the user can turn it off from the same panel.
          setMode("lite");
          setSuggestion("auto");
        } else {
          setSuggestion("suggest");
        }
      });
    }, MONITOR_START_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      monitor.stop();
    };
  }, [ready]);

  const enable = useCallback(() => {
    setMode("lite");
    setSuggestion(null);
  }, []);

  const disable = useCallback(() => {
    setMode("normal");
    setSuggestion(null);
    badStreak.current = 0;
  }, []);

  const toggle = useCallback(() => {
    setMode((current) => {
      const next: PerfMode = current === "lite" ? "normal" : "lite";
      if (next === "normal") badStreak.current = 0;
      return next;
    });
    setSuggestion(null);
  }, []);

  const setAutoOptimize = useCallback((value: boolean) => {
    setAutoOptimizeState(value);
    autoRef.current = value;
    try {
      localStorage.setItem(PERF_STORAGE.auto, value ? "1" : "0");
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const dismissSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  const dismissAndSuppress = useCallback(() => {
    setSuggestion(null);
    setSuppressed(true);
    suppressedRef.current = true;
    try {
      localStorage.setItem(PERF_STORAGE.dismissed, "1");
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const resetSuppression = useCallback(() => {
    setSuppressed(false);
    suppressedRef.current = false;
    try {
      localStorage.removeItem(PERF_STORAGE.dismissed);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const value = useMemo<PerformanceContextValue>(
    () => ({
      mode,
      lite: mode === "lite",
      evaluation,
      level: evaluation?.level ?? "normal",
      sources: evaluation?.sources ?? [],
      autoOptimize,
      setAutoOptimize,
      enable,
      disable,
      toggle,
      suggestion,
      dismissSuggestion,
      dismissAndSuppress,
      suppressed,
      resetSuppression,
    }),
    [
      mode,
      evaluation,
      autoOptimize,
      setAutoOptimize,
      enable,
      disable,
      toggle,
      suggestion,
      dismissSuggestion,
      dismissAndSuppress,
      suppressed,
      resetSuppression,
    ]
  );

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance(): PerformanceContextValue {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error("usePerformance must be used inside PerformanceProvider");
  }
  return context;
}

/** Human-readable status copy for the four levels. */
export const PERF_LEVEL_COPY: Record<
  PerfLevel,
  { label: string; description: string; tone: string }
> = {
  normal: {
    label: "Running smoothly",
    description: "Animations and effects are keeping up nicely on this device.",
    tone: "bg-[#DDF3E8] text-[#2f7a5c] dark:bg-[#1f3a2e] dark:text-[#a7e6cb]",
  },
  moderate: {
    label: "A little busy",
    description:
      "Some frames or taps are arriving slightly late. Performance Mode can help.",
    tone: "bg-cream text-[#8a6414] dark:bg-[#3d3020] dark:text-[#ffdc95]",
  },
  degraded: {
    label: "Working hard",
    description:
      "The page is showing repeated slowdowns on this device. Performance Mode is recommended.",
    tone: "bg-[#F7DCE8] text-[#a34b60] dark:bg-[#472734] dark:text-[#ffb9ce]",
  },
  critical: {
    label: "Struggling",
    description:
      "Responsiveness is significantly impaired right now. Turn on Performance Mode for a smoother experience.",
    tone: "bg-[#E892A2]/20 text-[#a34b60] dark:bg-[#472734] dark:text-[#ffb9ce]",
  },
};
