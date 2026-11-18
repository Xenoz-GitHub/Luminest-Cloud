import { describe, expect, it } from "vitest";
import {
  buildSummaryPrompt,
  composeSummaryText,
  parseApiKeys,
  parseSummaryResponse,
} from "./provider";

describe("AI key parsing", () => {
  it("splits comma-separated keys and trims whitespace", () => {
    expect(parseApiKeys(" key-one , key-two,key-three ")).toEqual([
      "key-one",
      "key-two",
      "key-three",
    ]);
  });

  it("ignores empty entries, trailing commas and duplicate keys", () => {
    expect(parseApiKeys("key-one,, key-two, key-one,   ")).toEqual([
      "key-one",
      "key-two",
    ]);
  });

  it("accepts newline-separated values from copied env files", () => {
    expect(parseApiKeys("key-one\nkey-two\n")).toEqual(["key-one", "key-two"]);
  });

  it("returns an empty list for missing values", () => {
    expect(parseApiKeys(undefined)).toEqual([]);
    expect(parseApiKeys("   ")).toEqual([]);
  });
});

describe("AI summary parsing", () => {
  it("parses a strict JSON response", () => {
    const content = parseSummaryResponse(
      JSON.stringify({
        overview: "A short overview.",
        mainIdeas: ["One", "Two"],
        importantPoints: ["Point"],
        keyTerms: ["Term"],
        importantDates: ["1 May 2026"],
        conclusions: "A conclusion.",
        pageReferences: ["Page 1: Intro"],
      })
    );
    expect(content.overview).toBe("A short overview.");
    expect(content.mainIdeas).toEqual(["One", "Two"]);
    expect(content.keyTerms).toEqual(["Term"]);
    expect(content.pageReferences).toEqual(["Page 1: Intro"]);
  });

  it("handles fenced JSON and surrounding prose", () => {
    const content = parseSummaryResponse(
      '```json\n{"overview":"Fenced","main_ideas":["A"],"key_terms":["T"]}\n```'
    );
    expect(content.overview).toBe("Fenced");
    expect(content.mainIdeas).toEqual(["A"]);
    expect(content.keyTerms).toEqual(["T"]);
  });

  it("falls back to readable text when JSON is invalid", () => {
    const content = parseSummaryResponse("The model returned plain prose.");
    expect(content.overview).toBe("The model returned plain prose.");
    expect(content.mainIdeas).toEqual([]);
  });

  it("truncates huge prompts and notes the truncation", () => {
    const prompt = buildSummaryPrompt({
      text: "x".repeat(40_000),
      fileName: "big.txt",
      pageCount: 12,
    });
    expect(prompt).toContain("was truncated");
    expect(prompt.length).toBeLessThan(30_000);
    expect(prompt).toContain("Document name: big.txt");
  });

  it("composes a readable plain-text summary", () => {
    const text = composeSummaryText({
      overview: "Overview",
      mainIdeas: ["Idea"],
      importantPoints: ["Point"],
      keyTerms: ["Term"],
      importantDates: [],
      conclusions: "End",
      pageReferences: [],
    });
    expect(text).toContain("Overview");
    expect(text).toContain("• Idea");
    expect(text).toContain("Conclusions:\nEnd");
  });
});
