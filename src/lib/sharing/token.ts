import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Share tokens are deterministic HMACs of the share row id, which lets the app
 * reconstruct a user's link at any time without storing the token itself.
 * Only the SHA-256 hash of the token is persisted.
 */
function getSecret(): string {
  const configured = process.env.SHARE_TOKEN_SECRET;
  if (configured && configured.length >= 16) return configured;

  // The service-role key is a high-entropy server-only secret, so deriving the
  // share secret from it is acceptable when SHARE_TOKEN_SECRET is unset.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && serviceKey.length >= 16) {
    return `luminest-share:${serviceKey}`;
  }

  // Never sign share links with a publicly-known constant in production: that
  // would let anyone forge a valid token for any share id.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Share links are misconfigured: set SHARE_TOKEN_SECRET to a long random value."
    );
  }

  return "luminest-development-share-secret-change-me";
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createShareToken(shareId: string): string {
  const signature = createHmac("sha256", getSecret())
    .update(`share:${shareId}`)
    .digest("base64url");
  return `${shareId}.${signature}`;
}

export function parseShareToken(token: string): string | null {
  if (!token || token.length > 200) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const shareId = token.slice(0, separator);
  if (!UUID_PATTERN.test(shareId)) return null;
  return shareId;
}

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyShareToken(token: string, storedHash: string): boolean {
  try {
    const computed = Buffer.from(hashShareToken(token), "hex");
    const stored = Buffer.from(storedHash, "hex");
    if (computed.length !== stored.length) return false;
    return timingSafeEqual(computed, stored);
  } catch {
    return false;
  }
}

export function shareAccessCookieName(shareId: string): string {
  return `ln_share_${shareId.replace(/-/g, "")}`;
}

export function createShareAccessValue(shareId: string): string {
  return createHmac("sha256", getSecret())
    .update(`access:${shareId}`)
    .digest("base64url");
}

export function verifyShareAccessValue(
  shareId: string,
  value: string | undefined
): boolean {
  if (!value) return false;
  const expected = createShareAccessValue(shareId);
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Password hashing uses scrypt with a per-share random salt. */
export function hashSharePassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export function verifySharePassword(
  password: string,
  stored: string | null
): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function baseUrl(): string {
  const configured =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function buildShareUrl(token: string): string {
  return `${baseUrl()}/s/${token}`;
}
