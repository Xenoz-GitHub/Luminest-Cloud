import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const body = await readJson<{ shareId?: string }>(request);
  if (!body?.shareId) return jsonError("Choose a share link to revoke.");

  const { data } = await supabase
    .from("share_links")
    .select("id")
    .eq("id", body.shareId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return jsonError("That share link doesn’t exist.", 404);

  const { error: revokeError } = await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", body.shareId)
    .eq("user_id", user.id);

  if (revokeError) return jsonError("That link could not be revoked.", 500);
  return NextResponse.json({ ok: true });
}
