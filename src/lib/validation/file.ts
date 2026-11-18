import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MIME_BY_EXTENSION,
} from "@/lib/constants";
import { getExtension, sanitizeFilename } from "@/lib/format";

export interface FileValidationResult {
  ok: boolean;
  error?: string;
  extension?: string;
  safeName?: string;
}

export function validateFileMetadata(input: {
  name: string;
  mimeType: string;
  size: number;
}): FileValidationResult {
  const extension = getExtension(input.name);
  if (!extension) {
    return { ok: false, error: "The file has no extension." };
  }
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      ok: false,
      error: `.${extension} files are not supported. Use PDF, DOC, DOCX, TXT, PPT, PPTX, PNG, JPG, WEBP or GIF.`,
    };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (input.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: "Files must be 50 MB or smaller.",
    };
  }
  const allowedMimes = MIME_BY_EXTENSION[extension] ?? [];
  const mime = (input.mimeType || "application/octet-stream").toLowerCase();
  if (!allowedMimes.includes(mime)) {
    return {
      ok: false,
      error: `The file content type (${mime}) does not match .${extension}.`,
    };
  }
  const safeName = sanitizeFilename(input.name);
  if (!safeName) {
    return { ok: false, error: "That file name cannot be used." };
  }
  return { ok: true, extension, safeName };
}

export function isPreviewable(extension: string): boolean {
  return ["pdf", "docx", "txt", "png", "jpg", "jpeg", "webp", "gif"].includes(
    extension.toLowerCase()
  );
}

/** True when the extension can produce visual page previews in the browser. */
export function hasVisualPreview(extension: string): boolean {
  return ["pdf", "png", "jpg", "jpeg", "webp", "gif"].includes(
    extension.toLowerCase()
  );
}
