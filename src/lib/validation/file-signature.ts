import type { SupabaseClient } from "@supabase/supabase-js";

interface SignatureResult {
  ok: boolean;
  reason?: string;
}

const ZIP_HEADER = [0x50, 0x4b, 0x03, 0x04];
const OLE_HEADER = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47];
const JPG_HEADER = [0xff, 0xd8, 0xff];
const GIF_HEADER = [0x47, 0x49, 0x46, 0x38];

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return Array.from(bytes.slice(start, end))
    .map((byte) => String.fromCharCode(byte))
    .join("");
}

/**
 * Reads the first bytes of a stored object and checks the file signature
 * against the claimed extension. This prevents a renamed executable from
 * being treated as a previewable document.
 */
export async function verifyStoredFileSignature(
  supabase: SupabaseClient,
  storagePath: string,
  extension: string
): Promise<SignatureResult> {
  const ext = extension.toLowerCase();
  if (ext === "txt") return { ok: true };
  if (!["pdf", "doc", "docx", "ppt", "pptx", "png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return { ok: false, reason: "Unsupported file type." };
  }

  const { data, error } = await supabase.storage
    .from("files")
    .createSignedUrl(storagePath, 60);
  if (error || !data?.signedUrl) {
    return { ok: false, reason: "The uploaded file could not be read back." };
  }

  let bytes: Uint8Array | null = null;
  try {
    const response = await fetch(data.signedUrl, {
      headers: { Range: "bytes=0-1023" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return { ok: false, reason: "The uploaded file could not be read back." };
    }
    const reader = response.body?.getReader();
    if (reader) {
      const chunk = await reader.read();
      if (chunk.value) bytes = chunk.value.slice(0, 1024);
      await reader.cancel().catch(() => undefined);
    } else {
      bytes = new Uint8Array(await response.arrayBuffer()).slice(0, 1024);
    }
  } catch {
    return { ok: false, reason: "The uploaded file could not be read back." };
  }

  if (!bytes || bytes.length === 0) {
    return { ok: false, reason: "The uploaded file is empty." };
  }

  let ok = false;
  switch (ext) {
    case "pdf":
      ok = startsWith(bytes, PDF_HEADER);
      break;
    case "doc":
    case "ppt":
      ok = startsWith(bytes, OLE_HEADER);
      break;
    case "docx":
    case "pptx":
      ok = startsWith(bytes, ZIP_HEADER);
      break;
    case "png":
      ok = startsWith(bytes, PNG_HEADER);
      break;
    case "jpg":
    case "jpeg":
      ok = startsWith(bytes, JPG_HEADER);
      break;
    case "gif":
      ok = startsWith(bytes, GIF_HEADER);
      break;
    case "webp":
      ok = ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
      break;
    default:
      ok = false;
  }

  if (!ok) {
    return {
      ok: false,
      reason: `The file content does not look like a valid .${ext} file.`,
    };
  }
  return { ok: true };
}
