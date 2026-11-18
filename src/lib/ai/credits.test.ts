import { afterEach, describe, expect, it, vi } from "vitest";
import { getAIPlan, AI_PLANS } from "@/lib/constants";
import { summaryCreditCost } from "./credits";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI credit plan", () => {
  it("defaults unknown or missing plans to free", () => {
    expect(getAIPlan(undefined).id).toBe("free");
    expect(getAIPlan(null).id).toBe("free");
    expect(getAIPlan("not-a-plan").id).toBe("free");
    expect(getAIPlan("free").id).toBe("free");
  });

  it("uses a 2-hour window by default", () => {
    expect(AI_PLANS.free.windowSeconds).toBe(2 * 60 * 60);
  });
});

describe("summaryCreditCost", () => {
  it("costs the base amount for small documents", () => {
    expect(summaryCreditCost(0)).toBe(1);
    expect(summaryCreditCost(1_000)).toBe(1);
    expect(summaryCreditCost(20_000)).toBe(1);
  });

  it("scales up for larger documents and caps at 5", () => {
    expect(summaryCreditCost(20_001)).toBe(2);
    expect(summaryCreditCost(40_001)).toBe(3);
    expect(summaryCreditCost(1_000_000)).toBe(5);
  });
});
