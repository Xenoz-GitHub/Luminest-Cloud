import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson } from "@/lib/http";
import { sanitizeFilename } from "@/lib/format";
import { deleteImageKitFile } from "@/lib/imagekit";
import type { FileRecord } from "@/types";

export const runtime = "nodejs";

interface PatchBody {
  name?: string;
  folderId?: string | null;
  isFavorite?: boolean;
  restore?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data: existingData } = await supabase
    .from("files")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const existing = existingData as FileRecord | null;
  if (!existing) return jsonError("That file doesn’t exist.", 404);

  const body = await readJson<PatchBody>(request);
  if (!body) return jsonError("No changes were provided.");

  const updates: Record<string, unknown> = {};
  if (typeof body.isFavorite === "boolean") {
    updates.is_favorite = body.isFavorite;
  }
  if (typeof body.restore === "boolean" && body.restore) {
    updates.deleted_at = null;
  }
  if (body.folderId !== undefined) {
    if (body.folderId === null) {
      updates.folder_id = null;
    } else {
      const { data: folder } = await supabase
        .from("folders")
        .select("id")
        .eq("id", body.folderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!folder) return jsonError("That folder doesn’t exist.", 404);
      updates.folder_id = body.folderId;
    }
  }
  if (typeof body.name === "string") {
    let candidate = sanitizeFilename(body.name).slice(0, 170);
    if (!candidate) return jsonError("Please provide a file name.");
    const suffix = `.${existing.extension}`;
    if (!candidate.toLowerCase().endsWith(suffix.toLowerCase())) {
      candidate = `${candidate}${suffix}`;
    }
    updates.name = candidate;
  }

  if (!Object.keys(updates).length) {
    return jsonError("No supported changes were provided.");
  }
  updates.updated_at = new Date().toISOString();

  const { data, error: updateError } = await supabase
    .from("files")
    .update(updates)
    .eq("id", existing.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError) return jsonError("Those changes could not be saved.", 500);
  return NextResponse.json({ file: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data: existingData } = await supabase
    .from("files")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const existing = existingData as FileRecord | null;
  if (!existing) return jsonError("That file doesn’t exist.", 404);

  const permanent = new URL(request.url).searchParams.get("permanent") === "true";

  if (!permanent) {
    const { error: deleteError } = await supabase
      .from("files")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (deleteError) return jsonError("That file could not be moved to the bin.", 500);
    return NextResponse.json({ ok: true, permanent: false });
  }

  const { data: previews } = await supabase
    .from("file_previews")
    .select("storage_path")
    .eq("file_id", existing.id)
    .eq("user_id", user.id);

  const previewPaths = (previews ?? [])
    .map((preview) => preview.storage_path)
    .filter(Boolean);
  if (previewPaths.length) {
    await supabase.storage.from("previews").remove(previewPaths);
  }

  if (existing.storage_provider === "imagekit") {
    if (existing.imagekit_file_id) {
      await deleteImageKitFile(existing.imagekit_file_id);
    }
  } else {
    await supabase.storage.from("files").remove([existing.storage_path]);
  }

  const { error: deleteError } = await supabase
    .from("files")
    .delete()
    .eq("id", existing.id)
    .eq("user_id", user.id);
  if (deleteError) return jsonError("That file could not be deleted.", 500);

  return NextResponse.json({ ok: true, permanent: true });
}
