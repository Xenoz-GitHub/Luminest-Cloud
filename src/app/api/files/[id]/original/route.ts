import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/http";
import { buildSignedImageUrl } from "@/lib/imagekit";
import type { FileRecord } from "@/types";

export const runtime = "nodejs";

/**
 * Returns a short-lived signed URL for the owner's original file. Used by the
 * retry flow, which re-reads the file in the browser to rebuild previews. The
 * URL is never persisted and expires quickly.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data } = await supabase
    .from("files")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const file = data as FileRecord | null;
  if (!file) return jsonError("That file doesn’t exist.", 404);
  if (file.deleted_at) return jsonError("Restore that file before opening it.", 410);

  if (file.storage_provider === "imagekit") {
    const url = buildSignedImageUrl(file.storage_path, { ttlSeconds: 120 });
    if (!url) {
      return jsonError("The original file could not be opened.", 500);
    }
    return NextResponse.json({
      url,
      name: file.name,
      mimeType: file.mime_type,
      expiresIn: 120,
    });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("files")
    .createSignedUrl(file.storage_path, 120);
  if (signError || !signed?.signedUrl) {
    return jsonError("The original file could not be opened.", 500);
  }

  return NextResponse.json({
    url: signed.signedUrl,
    name: file.name,
    mimeType: file.mime_type,
    expiresIn: 120,
  });
}
