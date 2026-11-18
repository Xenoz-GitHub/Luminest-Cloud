import { createHmac } from "node:crypto";

/**
 * ImageKit integration for plain images.
 *
 * Images are uploaded straight from the browser to ImageKit using a short-lived
 * signature minted here, so large files never pass through a serverless
 * function. Files are stored as PRIVATE and served through signed URLs that we
 * generate per request, keeping the same privacy model as Supabase storage.
 *
 * Only server code may import this module: it reads the private key.
 */

export const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const IMAGEKIT_API_BASE = "https://api.imagekit.io/v1";

export function getImageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey =
    process.env.IMAGEKIT_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint =
    process.env.IMAGEKIT_URL_ENDPOINT ||
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  return { privateKey, publicKey, urlEndpoint };
}

export function isImageKitConfigured(): boolean {
  const { privateKey, publicKey, urlEndpoint } = getImageKitConfig();
  return Boolean(privateKey && publicKey && urlEndpoint);
}

function hmacSha1Hex(key: string, value: string): string {
  return createHmac("sha1", key).update(value).digest("hex");
}

/**
 * Credentials the browser needs to upload one file. The token is unique per
 * upload and expires quickly, so it cannot be reused for other files.
 */
export function createUploadCredentials(userId: string) {
  const { privateKey, publicKey } = getImageKitConfig();
  if (!privateKey || !publicKey) {
    throw new Error("ImageKit is not configured.");
  }
  const token = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const expire = Math.floor(Date.now() / 1000) + 60 * 10;
  const signature = hmacSha1Hex(privateKey, token + expire);
  return { token, expire, signature, publicKey };
}

/** Force a download rather than an inline render. */
export const ATTACHMENT_PARAM = "ik-attachment=true";

/**
 * Build a signed URL for a private ImageKit file. `ttlSeconds` keeps links
 * short-lived, matching the Supabase signed-URL behaviour used elsewhere.
 */
export function buildSignedImageUrl(
  filePath: string,
  options: { ttlSeconds?: number; attachment?: boolean } = {}
): string | null {
  const { privateKey, urlEndpoint } = getImageKitConfig();
  if (!privateKey || !urlEndpoint) return null;

  const ttl = options.ttlSeconds ?? 120;
  const expiry = Math.floor(Date.now() / 1000) + ttl;
  const signature = hmacSha1Hex(privateKey, filePath + expiry);

  const base = `${urlEndpoint.replace(/\/$/, "")}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
  const params = new URLSearchParams({
    "ik-t": String(expiry),
    "ik-s": signature,
  });
  if (options.attachment) params.set("ik-attachment", "true");
  return `${base}?${params.toString()}`;
}

/** Delete the original image from ImageKit. Best effort; never throws. */
export async function deleteImageKitFile(fileId: string): Promise<void> {
  const { privateKey } = getImageKitConfig();
  if (!privateKey || !fileId) return;
  try {
    const auth = Buffer.from(`${privateKey}:`).toString("base64");
    await fetch(`${IMAGEKIT_API_BASE}/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${auth}` },
    });
  } catch {
    // Orphaned images are harmless and can be swept later.
  }
}
