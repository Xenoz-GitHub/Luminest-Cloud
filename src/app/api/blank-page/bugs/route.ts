import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, readJson, requestIp } from "@/lib/http";
import { audit, isSameOrigin, requireAdminSession } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["open", "triaged", "resolved", "dismissed"];

/** Update a bug report's status or admin note. */
export async function PATCH(request: Request) {
  if (!requireAdminSession()) {
    return jsonError("Not authorised.", 401);
  }
  if (!isSameOrigin(request)) {
    return jsonError("This request could not be verified.", 403);
  }

  const body = await readJson<{
    id?: string;
    status?: string;
    adminNote?: string | null;
  }>(request);
  if (!body?.id) return jsonError("A report id is required.");

  const updates: Record<string, unknown> = {};
  if (typeof body.status === "string") {
    if (!ALLOWED_STATUS.includes(body.status)) {
      return jsonError("That status is not valid.");
    }
    updates.status = body.status;
  }
  if (body.adminNote !== undefined) {
    updates.admin_note =
      typeof body.adminNote === "string" ? body.adminNote.slice(0, 2000) : null;
  }
  if (!Object.keys(updates).length) {
    return jsonError("No supported changes were provided.");
  }
  updates.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { error } = await admin
    .from("bug_reports")
    .update(updates)
    .eq("id", body.id);

  if (error) {
    await audit("bug.update.failed", {
      ip: requestIp(request),
      detail: { id: body.id, error: error.message },
      success: false,
    });
    return jsonError("That report could not be updated.", 500);
  }

  await audit("bug.update", {
    ip: requestIp(request),
    detail: { id: body.id, ...updates },
  });

  return NextResponse.json({ ok: true });
}
