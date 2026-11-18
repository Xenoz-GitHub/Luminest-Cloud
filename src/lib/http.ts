import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getApiUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
  } catch {
    return { supabase: null, user: null };
  }
}

export async function requireApiUser() {
  const { supabase, user } = await getApiUser();
  if (!supabase || !user) {
    return {
      error: jsonError("You need to sign in to do that.", 401),
      supabase: null,
      user: null,
    } as const;
  }
  return { error: null, supabase, user } as const;
}

/** Default maximum accepted JSON body size for API routes. */
export const MAX_JSON_BYTES = 64 * 1024;

export function requestIp(request: Request): string {
  // Prefer the header the platform sets itself. For x-forwarded-for, use the
  // LAST hop (appended by the closest proxy) instead of the first, because a
  // client can prepend arbitrary values to spoof the first entry and dodge
  // per-IP rate limits.
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return "local";
}

/**
 * Parse a JSON request body defensively.
 *
 * Rejects non-JSON content types (blocks simple cross-site form posts and
 * text/plain payloads) and enforces a byte ceiling before parsing so a single
 * request cannot exhaust memory. Routes that legitimately accept large bodies
 * must pass a higher `maxBytes`.
 */
export async function readJson<T>(
  request: Request,
  maxBytes: number = MAX_JSON_BYTES
): Promise<T | null> {
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("application/json")) return null;

  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
