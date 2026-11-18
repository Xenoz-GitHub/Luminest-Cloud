import { describe, expect, it } from "vitest";
import { summarizeLocally } from "./local-summarizer";

const TEXT = `Page 1: The project plan outlines three main goals. The first goal is to improve accessibility for all users. The second goal is to reduce load times. The third goal is to add offline support. The team must deliver the beta by March 15, 2026.

Page 2: In conclusion, the project will improve accessibility, performance, and reliability. The budget is 50000 dollars. The team should review progress monthly.`;

describe("summarizeLocally", () => {
  it("produces a structured summary without any AI", () => {
    const result = summarizeLocally({ text: TEXT, fileName: "plan.txt" });

    expect(result.model).toBe("extractive");
    expect(result.content.overview.length).toBeGreaterThan(20);
    expect(result.content.mainIdeas.length).toBeGreaterThan(0);
    expect(result.content.keyTerms.length).toBeGreaterThan(0);
    expect(result.content.importantDates.join(" ")).toMatch(/2026|March/i);
    expect(
      result.content.pageReferences.some((ref) => ref.startsWith("Page 1"))
    ).toBe(true);
  });

  it("handles text with no sentence punctuation gracefully", () => {
    const result = summarizeLocally({
      text: "a b c d e f g h i j k l m n o p q r s t u v w x y z",
      fileName: "blob.txt",
    });
    expect(typeof result.content.overview).toBe("string");
  });

  it("does not invent dates that are absent", () => {
    const result = summarizeLocally({
      text: "This document has no calendar information at all, only words about a calm and quiet garden.",
      fileName: "garden.txt",
    });
    expect(result.content.importantDates).toEqual([]);
  });
});
