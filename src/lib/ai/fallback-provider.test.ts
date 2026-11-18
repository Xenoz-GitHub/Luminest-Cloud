import { describe, expect, it, vi } from "vitest";
import { FallbackAIProvider } from "./fallback-provider";
import {
  AIConfigurationError,
  type AIProvider,
  type SummaryRequest,
  type SummaryResult,
} from "./provider";

const request: SummaryRequest = {
  text: "A document to summarize.",
  fileName: "notes.txt",
};

const success: SummaryResult = {
  content: {
    overview: "Overview",
    mainIdeas: [],
    importantPoints: [],
    keyTerms: [],
    importantDates: [],
    conclusions: "",
    pageReferences: [],
  },
  model: "test-model",
  raw: "{}",
};

describe("FallbackAIProvider", () => {
  it("tries keys in order and stops at the first success", async () => {
    const first = vi.fn(async () => {
      throw new Error("401 invalid key");
    });
    const second = vi.fn(async () => success);
    const third = vi.fn(async () => success);

    const provider = new FallbackAIProvider([
      { name: "groq", generateSummary: first },
      { name: "groq", generateSummary: second },
      { name: "groq", generateSummary: third },
    ]);

    await expect(provider.generateSummary(request)).resolves.toBe(success);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(third).not.toHaveBeenCalled();
  });

  it("reports the provider that produced the winning summary", async () => {
    const provider = new FallbackAIProvider([
      {
        name: "groq",
        generateSummary: vi.fn(async () => {
          throw new Error("429 rate limited");
        }),
      },
      { name: "gemini", generateSummary: vi.fn(async () => success) },
    ]);

    await provider.generateSummary(request);

    expect(provider.name).toBe("gemini");
  });

  it("reports the last failure after every key is exhausted", async () => {
    const keys: AIProvider[] = [
      {
        name: "groq",
        generateSummary: vi.fn(async () => {
          throw new Error("401 invalid key");
        }),
      },
      {
        name: "groq",
        generateSummary: vi.fn(async () => {
          throw new Error("429 rate limited");
        }),
      },
    ];

    const provider = new FallbackAIProvider(keys);

    await expect(provider.generateSummary(request)).rejects.toThrow(
      /All 2 AI API keys failed.*key 2: 429 rate limited/
    );
  });

  it("tries every key when failures are fast and bounds each attempt", async () => {
    const calls = Array.from({ length: 5 }, (_, index) =>
      vi.fn(async (input: SummaryRequest) => {
        expect(input.timeoutMs).toBeGreaterThan(0);
        expect(input.timeoutMs).toBeLessThanOrEqual(75_000);
        throw new Error(`failure-${index}`);
      })
    );

    const provider = new FallbackAIProvider(
      calls.map((generateSummary, index) => ({
        name: `provider-${index}`,
        generateSummary,
      }))
    );

    await expect(provider.generateSummary(request)).rejects.toThrow(
      /All 5 AI API keys failed.*key 5: failure-4/
    );
    calls.forEach((call) => expect(call).toHaveBeenCalledTimes(1));
  });

  it("requires at least one provider", () => {
    expect(() => new FallbackAIProvider([])).toThrow(AIConfigurationError);
  });
});
