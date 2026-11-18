import { describe, expect, it } from "vitest";
import {
  hasVisualPreview,
  isPreviewable,
  validateFileMetadata,
} from "./file";

describe("file metadata validation", () => {
  it("accepts a supported file", () => {
    const result = validateFileMetadata({
      name: "Notes.pdf",
      mimeType: "application/pdf",
      size: 2048,
    });
    expect(result.ok).toBe(true);
    expect(result.extension).toBe("pdf");
    expect(result.safeName).toBe("Notes.pdf");
  });

  it("rejects missing and unsupported extensions", () => {
    expect(
      validateFileMetadata({ name: "README", mimeType: "text/plain", size: 10 }).ok
    ).toBe(false);
    expect(
      validateFileMetadata({
        name: "program.exe",
        mimeType: "application/octet-stream",
        size: 10,
      }).ok
    ).toBe(false);
  });

  it("rejects empty and oversized files", () => {
    expect(
      validateFileMetadata({ name: "a.pdf", mimeType: "application/pdf", size: 0 })
        .ok
    ).toBe(false);
    expect(
      validateFileMetadata({
        name: "a.pdf",
        mimeType: "application/pdf",
        size: 51 * 1024 * 1024,
      }).ok
    ).toBe(false);
  });

  it("rejects mismatched MIME types", () => {
    const result = validateFileMetadata({
      name: "photo.png",
      mimeType: "application/pdf",
      size: 10,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("does not match");
  });

  it("reports which types can be previewed", () => {
    expect(isPreviewable("pdf")).toBe(true);
    expect(isPreviewable("pptx")).toBe(false);
    expect(hasVisualPreview("png")).toBe(true);
    expect(hasVisualPreview("txt")).toBe(false);
  });
});
