import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/http";
import { buildSignedImageUrl } from "@/lib/imagekit";
import type { FileRecord } from "@/types";

export const runtime = "nodejs";

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
  if (file.deleted_at) return jsonError("That file is in the bin.", 410);

  if (file.storage_provider === "imagekit") {
    const url = buildSignedImageUrl(file.storage_path, {
      ttlSeconds: 60,
      attachment: true,
    });
    if (!url) {
      return jsonError("A secure download link could not be created.", 500);
    }
    return NextResponse.redirect(url, { status: 302 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("files")
    .createSignedUrl(file.storage_path, 60, {
      download: file.original_filename,
    });
  if (signError || !signed?.signedUrl) {
    return jsonError("A secure download link could not be created.", 500);
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
