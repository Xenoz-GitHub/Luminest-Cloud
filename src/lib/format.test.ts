import { describe, expect, it } from "vitest";
import {
  formatBytes,
  getExtension,
  getFileCategory,
  initials,
  percent,
  sanitizeFilename,
  stripExtension,
  truncateText,
} from "./format";

describe("format helpers", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("reads extensions case-insensitively", () => {
    expect(getExtension("Report.PDF")).toBe("pdf");
    expect(getExtension("photo.final.JPG")).toBe("jpg");
    expect(getExtension("no-extension")).toBe("");
    expect(getExtension("file.pdf?download=1#page")).toBe("pdf");
  });

  it("strips extensions and sanitizes names", () => {
    expect(stripExtension("annual.report.pdf")).toBe("annual.report");
    expect(stripExtension("README")).toBe("README");
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("a/b\\c:?.txt")).toBe("c__.txt");
    expect(sanitizeFilename("...")).toBe("file");
  });

  it("categorizes supported file types", () => {
    expect(getFileCategory("pdf")).toBe("pdf");
    expect(getFileCategory("docx")).toBe("document");
    expect(getFileCategory("ppt")).toBe("presentation");
    expect(getFileCategory("webp")).toBe("image");
    expect(getFileCategory("txt")).toBe("text");
    expect(getFileCategory("zip")).toBe("other");
  });

  it("clamps percentages and makes initials", () => {
    expect(percent(50, 100)).toBe(50);
    expect(percent(150, 100)).toBe(100);
    expect(percent(-10, 100)).toBe(0);
    expect(percent(1, 0)).toBe(0);
    expect(initials("Lumi Nest")).toBe("LN");
    expect(initials("lumi")).toBe("LU");
    expect(initials("  ")).toBe("LN");
  });

  it("truncates long text with an ellipsis", () => {
    expect(truncateText("short", 10)).toBe("short");
    expect(truncateText("this is a longer sentence", 10)).toBe("this is a…");
  });
});
