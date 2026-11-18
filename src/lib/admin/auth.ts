import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin authentication.
 *
 * Security model:
 * - The PIN is NEVER stored in code or the database. Only its scrypt hash is
 *   held in the server-only ADMIN_PIN_HASH environment variable.
 * - A successful unlock issues a signed, HttpOnly, SameSite=Lax cookie with a
 *   short lifetime. The cookie carries no identity claim, so it cannot be
 *   replayed against Supabase; it only unlocks these server-rendered pages.
 * - Failed attempts are recorded in Postgres so throttling survives serverless
 *   cold starts and instance fan-out.
 * - Every access and mutation is written to admin_audit_log.
 */

export const ADMIN_COOKIE = "ln_admin";
/** 8 hours. Short enough that a leaked cookie is not a permanent key. */
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MINUTES = 15;

function sessionSecret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && serviceKey.length >= 16) {
    return `luminest-admin-session:${serviceKey}`;
  }

  const shareSecret = process.env.SHARE_TOKEN_SECRET;
  if (shareSecret && shareSecret.length >= 16) {
    return `luminest-admin-session:${shareSecret}`;
  }

  // Refuse to sign admin sessions with a guessable value in production.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Admin sessions are misconfigured: set ADMIN_SESSION_SECRET (or a service-role key)."
    );
  }
  return "luminest-development-admin-session-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Verify the supplied PIN against the stored scrypt hash.
 * Hash format: "scrypt:<saltHex>:<hashHex>".
 * Returns false when the hash is missing, so an unconfigured deployment cannot
 * be unlocked at all.
 */
export function verifyAdminPin(pin: string): boolean {
  const configured = process.env.ADMIN_PIN_HASH;
  if (!configured) return false;

  const parts = configured.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  try {
    const derived = scryptSync(pin, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** True when the deployment actually has a PIN configured. */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PIN_HASH);
}

/** Build a signed session token valid for ADMIN_SESSION_SECONDS. */
export function createAdminSession(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify signature and expiry. Returns the expiry when valid. */
export function verifyAdminSession(
  token: string | undefined
): { valid: boolean; expiresAt?: number } {
  if (!token) return { valid: false };
  if (token.length > 300) return { valid: false };

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return { valid: false };
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  if (!safeEqual(signature, sign(payload))) return { valid: false };

  const expiresAt = Number(payload.split(".")[0]);
  if (!Number.isFinite(expiresAt)) return { valid: false };
  if (expiresAt <= Math.floor(Date.now() / 1000)) return { valid: false };

  return { valid: true, expiresAt };
}

/** Read the admin cookie in a server component or route handler. */
export function readAdminCookie(): string | undefined {
  try {
    return cookies().get(ADMIN_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

/** Gate for server components and route handlers. */
export function requireAdminSession(): boolean {
  return verifyAdminSession(readAdminCookie()).valid;
}

export type ThrottleState = "ok" | "limited" | "unavailable";

/**
 * Persistent throttling. Counts failed attempts for this IP in the window.
 *
 * Distinguishes a genuine rate limit from a missing table: treating a broken
 * deployment as "too many attempts" would lock the operator out permanently
 * with a misleading message.
 */
export async function checkThrottle(ip: string): Promise<ThrottleState> {
  try {
    const admin = createAdminClient();
    const since = new Date(
      Date.now() - FAILURE_WINDOW_MINUTES * 60 * 1000
    ).toISOString();
    // NOTE: deliberately NOT using { head: true }. A HEAD request against a
    // missing table returns 204 with error=null, which would make a broken
    // deployment look like "no failed attempts" and silently disable
    // throttling. A real select surfaces PGRST205 so we can fail closed.
    const { data, error } = await admin
      .from("admin_login_attempts")
      .select("id")
      .eq("ip", ip)
      .eq("succeeded", false)
      .gte("created_at", since)
      .limit(MAX_FAILURES);

    // PGRST205 = table not found in schema cache; 42P01 = undefined_table.
    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return "unavailable";
      }
      return "limited";
    }

    return (data?.length ?? 0) >= MAX_FAILURES ? "limited" : "ok";
  } catch {
    return "unavailable";
  }
}

/** Record an attempt (success or failure). Never throws. */
export async function recordLoginAttempt(
  ip: string,
  succeeded: boolean
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_login_attempts").insert({ ip, succeeded });
    // Occasional pruning; cheap and bounded.
    if (Math.random() < 0.05) {
      await admin.rpc("prune_admin_login_attempts");
    }
  } catch {
    // Logging failures must never block or leak.
  }
}

/** Write an audit entry. Never throws. */
export async function audit(
  action: string,
  options: {
    detail?: Record<string, unknown>;
    ip?: string | null;
    userAgent?: string | null;
    success?: boolean;
  } = {}
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      action,
      detail: options.detail ?? null,
      ip: options.ip ?? null,
      user_agent: options.userAgent ?? null,
      success: options.success ?? true,
    });
  } catch {
    // Never let audit failures break the request.
  }
}

/**
 * Origin check for state-changing requests. SameSite=Lax already blocks
 * cross-site POSTs, but this is defence in depth against same-site subdomain
 * tricks and misconfigured proxies.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Same-origin fetches from some browsers omit Origin for GET only; for
    // mutations we require it.
    return false;
  }
  try {
    const host = request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
