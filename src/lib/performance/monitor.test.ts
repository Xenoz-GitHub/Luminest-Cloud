import { describe, expect, it } from "vitest";
import { scoreEvaluation, type PerfMetrics } from "./monitor";

function metrics(overrides: Partial<PerfMetrics> = {}): PerfMetrics {
  return {
    longTaskCount: 0,
    longTaskMs: 0,
    avgFrameMs: 0,
    droppedFrameRatio: 0,
    slowInteractions: 0,
    worstInteractionMs: 0,
    cls: 0,
    sampledFrames: 0,
    ...overrides,
  };
}

const SOURCES = ["longtask", "event"];

describe("scoreEvaluation", () => {
  it("reports normal for a smooth page with enough samples", () => {
    const result = scoreEvaluation(
      metrics({ sampledFrames: 300, avgFrameMs: 16.6, droppedFrameRatio: 0.01 }),
      SOURCES
    );
    expect(result.level).toBe("normal");
    expect(result.score).toBeLessThan(22);
  });

  it("refuses to judge when there is not enough evidence", () => {
    // Looks awful, but almost nothing was actually measured.
    const result = scoreEvaluation(
      metrics({ avgFrameMs: 200, droppedFrameRatio: 1, sampledFrames: 3 }),
      SOURCES
    );
    expect(result.level).toBe("normal");
    expect(result.score).toBe(0);
  });

  it("still judges when a slow interaction exists even with few frames", () => {
    const result = scoreEvaluation(
      metrics({ sampledFrames: 0, slowInteractions: 1, worstInteractionMs: 600 }),
      SOURCES
    );
    expect(result.level).not.toBe("normal");
  });

  it("escalates with sustained main-thread blocking", () => {
    const result = scoreEvaluation(
      metrics({
        sampledFrames: 300,
        longTaskCount: 8,
        longTaskMs: 900,
        avgFrameMs: 30,
        droppedFrameRatio: 0.3,
        worstInteractionMs: 300,
      }),
      SOURCES
    );
    expect(["degraded", "critical"]).toContain(result.level);
    expect(result.score).toBeGreaterThanOrEqual(45);
  });

  it("treats layout shift as minor compared with blocking", () => {
    const shifted = scoreEvaluation(
      metrics({ sampledFrames: 300, avgFrameMs: 16.6, cls: 0.4 }),
      ["layout-shift"]
    );
    // Shift alone should not escalate past moderate.
    expect(["normal", "moderate"]).toContain(shifted.level);
  });

  it("keeps the score inside 0-100", () => {
    const extreme = scoreEvaluation(
      metrics({
        sampledFrames: 300,
        longTaskMs: 100_000,
        longTaskCount: 99,
        avgFrameMs: 500,
        droppedFrameRatio: 1,
        worstInteractionMs: 99_000,
        cls: 10,
      }),
      SOURCES
    );
    expect(extreme.score).toBeLessThanOrEqual(100);
    expect(extreme.score).toBeGreaterThanOrEqual(0);
    expect(extreme.level).toBe("critical");
  });

  it("passes through which sources contributed", () => {
    const result = scoreEvaluation(metrics({ sampledFrames: 300 }), SOURCES);
    expect(result.sources).toEqual(SOURCES);
  });
});
