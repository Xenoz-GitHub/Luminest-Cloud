import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, readJson, requestIp } from "@/lib/http";
import { getApiUser } from "@/lib/http";

/**
 * Public bug-report intake.
 *
 * Reports are written with the service role so the anonymous client needs no
 * INSERT policy beyond the one that already exists, and so a malformed payload
 * cannot reach the table directly. Basic validation and length caps keep the
 * table clean.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = [
  "upload",
  "preview",
  "summary",
  "sharing",
  "account",
  "performance",
  "other",
];

// Very small in-memory guard; the authoritative limit is the row itself.
const recent = new Map<string, number>();

export async function POST(request: Request) {
  const ip = requestIp(request);
  const now = Date.now();
  const last = recent.get(ip) ?? 0;
  if (now - last < 20_000) {
    return jsonError("Please wait a moment before sending another report.", 429);
  }

  const body = await readJson<{
    category?: string;
    title?: string;
    details?: string;
    steps?: string;
    email?: string;
    pageUrl?: string;
  }>(request, 32 * 1024);
  if (!body) return jsonError("The report could not be read.");

  const title = (body.title ?? "").trim().slice(0, 140);
  const details = (body.details ?? "").trim().slice(0, 4000);
  if (title.length < 4) return jsonError("Add a short title.");
  if (details.length < 10) return jsonError("Tell us a little more.");

  const category = CATEGORIES.includes(body.category ?? "")
    ? (body.category as string)
    : "other";

  let userId: string | null = null;
  try {
    const { user } = await getApiUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("bug_reports").insert({
    user_id: userId,
    email: (body.email ?? "").trim().slice(0, 200) || null,
    category,
    title,
    details,
    steps: (body.steps ?? "").trim().slice(0, 2000) || null,
    page_url: (body.pageUrl ?? "").slice(0, 300) || null,
    user_agent: (request.headers.get("user-agent") ?? "").slice(0, 400),
  });

  if (error) {
    return jsonError("That report could not be saved.", 500);
  }

  recent.set(ip, now);
  if (recent.size > 500) recent.clear();

  return NextResponse.json({ ok: true });
}
