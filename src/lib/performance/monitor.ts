/**
 * Lightweight, feature-detected performance monitoring.
 *
 * Design constraints:
 * - Never assume an API exists. Every observer is registered only when the
 *   browser reports support for that entry type.
 * - Never sample continuously. Frame timing is measured in short bounded
 *   bursts, and only while the tab is visible, so we do not become the
 *   problem we are trying to detect.
 * - Classify the *website's* responsiveness, not the device. An old phone with
 *   a smooth page is "normal"; a fast laptop thrashing is not.
 * - No fingerprinting, no permissions, no hardware claims. Everything here is
 *   standard, same-origin performance measurement.
 */

export type PerfLevel = "normal" | "moderate" | "degraded" | "critical";

export interface PerfMetrics {
  /** Long main-thread tasks observed in the recent window. */
  longTaskCount: number;
  /** Total clamped long-task time (ms) in the recent window. */
  longTaskMs: number;
  /** Mean frame duration during the last sampling burst. */
  avgFrameMs: number;
  /** Share of sampled frames slower than ~2 frames at 60 Hz. */
  droppedFrameRatio: number;
  /** Slow interactions observed in the recent window. */
  slowInteractions: number;
  /** Worst interaction delay (ms) in the recent window. */
  worstInteractionMs: number;
  /** Layout shift accumulated during this window. */
  cls: number;
  /** How many frames the burst actually captured. */
  sampledFrames: number;
}

export interface PerfEvaluation {
  level: PerfLevel;
  /** 0 = excellent, 100 = severely impaired. Heuristic, not a benchmark. */
  score: number;
  metrics: PerfMetrics;
  /** Which browser APIs actually contributed data. */
  sources: string[];
}

type EvaluateHandler = (result: PerfEvaluation) => void;

interface TimedSample {
  at: number;
  duration: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

/** Frame sampling burst length. Short on purpose. */
const SAMPLE_MS = 5000;
/** Delay between bursts. Long on purpose. */
const EVAL_INTERVAL_MS = 15_000;
/** How far back long tasks and interactions are counted. */
const RECENT_WINDOW_MS = 30_000;
/** A frame slower than this counts as dropped. */
const SLOW_FRAME_MS = 33;
/** Ignore absurd deltas caused by tab suspension. */
const MAX_FRAME_DELTA_MS = 3000;

function supportsEntry(type: string): boolean {
  if (typeof PerformanceObserver === "undefined") return false;
  const types = (PerformanceObserver as unknown as { supportedEntryTypes?: string[] })
    .supportedEntryTypes;
  return Array.isArray(types) && types.includes(type);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class PerformanceMonitor {
  private longTasks: TimedSample[] = [];
  private interactions: TimedSample[] = [];
  private frames: number[] = [];
  private clsValue = 0;
  private observers: PerformanceObserver[] = [];
  private sources = new Set<string>();
  private rafHandle: number | null = null;
  private intervalHandle: number | null = null;
  private guardHandle: number | null = null;
  private sampling = false;
  private started = false;
  private handler: EvaluateHandler | null = null;

  /** Which performance APIs this browser actually exposed. */
  get supportedSources(): string[] {
    return [...this.sources];
  }

  start(handler: EvaluateHandler): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    this.handler = handler;

    this.observeLongTasks();
    this.observeInteractions();
    this.observeLayoutShift();

    // First measurement shortly after start, then on a slow cadence.
    window.setTimeout(() => this.runSampleBurst(), 1500);
    this.intervalHandle = window.setInterval(
      () => this.runSampleBurst(),
      EVAL_INTERVAL_MS
    );
  }

  stop(): void {
    for (const observer of this.observers) {
      try {
        observer.disconnect();
      } catch {
        // Ignore: the observer may already be gone.
      }
    }
    this.observers = [];
    if (this.intervalHandle !== null) window.clearInterval(this.intervalHandle);
    if (this.guardHandle !== null) window.clearTimeout(this.guardHandle);
    if (this.rafHandle !== null) window.cancelAnimationFrame(this.rafHandle);
    this.intervalHandle = null;
    this.guardHandle = null;
    this.rafHandle = null;
    this.sampling = false;
    this.started = false;
  }

  private observeLongTasks(): void {
    if (!supportsEntry("longtask")) return;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTasks.push({ at: entry.startTime, duration: entry.duration });
        }
        if (this.longTasks.length > 200) {
          this.longTasks.splice(0, this.longTasks.length - 200);
        }
      });
      observer.observe({ type: "longtask", buffered: true });
      this.observers.push(observer);
      this.sources.add("longtask");
    } catch {
      // Unsupported despite the check; carry on with other signals.
    }
  }

  private observeInteractions(): void {
    if (!supportsEntry("event")) return;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration < 100) continue;
          this.interactions.push({ at: entry.startTime, duration: entry.duration });
        }
        if (this.interactions.length > 120) {
          this.interactions.splice(0, this.interactions.length - 120);
        }
      });
      // durationThreshold keeps the stream quiet: only slow events arrive.
      observer.observe({ type: "event", buffered: true, durationThreshold: 100 } as PerformanceObserverInit);
      this.observers.push(observer);
      this.sources.add("event");
    } catch {
      // Older Safari lacks durationThreshold; event timing is simply skipped.
    }
  }

  private observeLayoutShift(): void {
    if (!supportsEntry("layout-shift")) return;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShiftEntry[]) {
          // Shifts caused by the user's own interaction are expected, not a fault.
          if (entry.hadRecentInput) continue;
          this.clsValue += entry.value;
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
      this.observers.push(observer);
      this.sources.add("layout-shift");
    } catch {
      // Not supported; CLS contributes nothing.
    }
  }

  /**
   * Measure frame pacing for a bounded burst, then evaluate. Skipped entirely
   * while the tab is hidden, which also avoids counting background throttling.
   */
  private runSampleBurst(): void {
    if (this.sampling) return;
    if (typeof document === "undefined" || document.visibilityState !== "visible") {
      return;
    }
    if (typeof requestAnimationFrame === "undefined") return;

    this.sampling = true;
    this.frames = [];
    let last = performance.now();
    const startedAt = last;

    // If the tab is hidden mid-burst, rAF stops firing. Reset without judging.
    this.guardHandle = window.setTimeout(() => {
      if (!this.sampling) return;
      this.abortBurst();
    }, SAMPLE_MS + 4000);

    const step = (now: number) => {
      const delta = now - last;
      last = now;
      if (delta > 0 && delta < MAX_FRAME_DELTA_MS) {
        this.frames.push(delta);
      }
      if (now - startedAt < SAMPLE_MS) {
        this.rafHandle = requestAnimationFrame(step);
        return;
      }
      this.rafHandle = null;
      this.sampling = false;
      if (this.guardHandle !== null) {
        window.clearTimeout(this.guardHandle);
        this.guardHandle = null;
      }
      this.evaluate();
    };

    this.rafHandle = requestAnimationFrame(step);
  }

  private abortBurst(): void {
    if (this.rafHandle !== null) window.cancelAnimationFrame(this.rafHandle);
    this.rafHandle = null;
    this.guardHandle = null;
    this.sampling = false;
    this.frames = [];
  }

  private evaluate(): void {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    const now = performance.now();

    const recentTasks = this.longTasks.filter(
      (task) => now - task.at < RECENT_WINDOW_MS
    );
    const recentEvents = this.interactions.filter(
      (event) => now - event.at < RECENT_WINDOW_MS
    );

    const longTaskCount = recentTasks.length;
    const longTaskMs = recentTasks.reduce(
      (total, task) => total + Math.min(task.duration, 500),
      0
    );

    const sampledFrames = this.frames.length;
    const avgFrameMs =
      sampledFrames > 0
        ? this.frames.reduce((total, value) => total + value, 0) / sampledFrames
        : 0;
    const slowFrames = this.frames.filter((value) => value > SLOW_FRAME_MS).length;
    const droppedFrameRatio = sampledFrames > 0 ? slowFrames / sampledFrames : 0;

    const slowInteractions = recentEvents.length;
    const worstInteractionMs = recentEvents.reduce(
      (worst, event) => Math.max(worst, event.duration),
      0
    );

    const metrics: PerfMetrics = {
      longTaskCount,
      longTaskMs,
      avgFrameMs,
      droppedFrameRatio,
      slowInteractions,
      worstInteractionMs,
      cls: this.clsValue,
      sampledFrames,
    };

    const evaluation = scoreEvaluation(metrics, this.sources);

    // Window is spent; start fresh so we measure the present, not history.
    this.clsValue = 0;
    this.longTasks = recentTasks.slice(-40);
    this.interactions = recentEvents.slice(-40);

    this.handler?.(evaluation);
  }
}

/**
 * Turn raw metrics into a bounded score and a plain-language level.
 *
 * Weighting reflects what users actually feel: blocked main thread and dropped
 * frames hurt most, slow taps are the strongest single signal of jank, and
 * layout shift is annoying but rarely makes a page feel "slow".
 */
export function scoreEvaluation(
  metrics: PerfMetrics,
  sources: Set<string> | string[]
): PerfEvaluation {
  const sourceList = Array.isArray(sources) ? sources : [...sources];

  let score = 0;

  // Main-thread blocking: ~1000ms of long tasks per window is severe.
  score += clamp((metrics.longTaskMs / 1000) * 40, 0, 40);

  // Frame pacing: a fifth of frames missing their deadline is noticeable.
  score += clamp(metrics.droppedFrameRatio * 100 * 1.3, 0, 25);

  // Sustained slow frames even when none individually exceed the threshold.
  if (metrics.avgFrameMs > 17) {
    score += clamp(((metrics.avgFrameMs - 17) / 25) * 20, 0, 20);
  }

  // Interaction delay, aligned with the INP guidance: ~200ms is the edge of
  // feeling instant, 500ms and beyond is "poor". A delayed tap is the most
  // direct evidence a user will notice, so it is weighted heavily enough to
  // reach "moderate" on its own even when frame sampling is unavailable.
  if (metrics.worstInteractionMs > 150) {
    score += clamp(((metrics.worstInteractionMs - 150) / 200) * 30, 0, 30);
  }

  // Layout shift, weighted lightly.
  if (metrics.cls > 0.1) {
    score += clamp((metrics.cls - 0.1) * 20, 0, 10);
  }

  score = Math.round(clamp(score, 0, 100));

  // Guard against false positives: too little evidence to accuse the page.
  const hasEnoughEvidence =
    metrics.sampledFrames >= 20 ||
    metrics.longTaskCount > 0 ||
    metrics.worstInteractionMs >= 150;

  if (!hasEnoughEvidence) {
    return { level: "normal", score: 0, metrics, sources: sourceList };
  }

  const level: PerfLevel =
    score >= 70
      ? "critical"
      : score >= 45
        ? "degraded"
        : score >= 22
          ? "moderate"
          : "normal";

  return { level, score, metrics, sources: sourceList };
}
