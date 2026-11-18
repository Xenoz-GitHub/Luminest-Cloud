import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson } from "@/lib/http";
import { folderDescendantIds } from "@/lib/data";
import type { FolderRecord } from "@/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data: existingData } = await supabase
    .from("folders")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const existing = existingData as FolderRecord | null;
  if (!existing) return jsonError("That folder doesn’t exist.", 404);

  const body = await readJson<{
    name?: string;
    color?: string;
    parentId?: string | null;
  }>(request);
  if (!body) return jsonError("No changes were provided.");

  const updates: Record<string, unknown> = {};
  const finalParentId =
    body.parentId !== undefined ? body.parentId : existing.parent_id;
  if (typeof body.name === "string") {
    const name = body.name.trim().slice(0, 80);
    if (!name) return jsonError("Folder names can’t be empty.");
    const { data: duplicate } = await (finalParentId
      ? supabase
          .from("folders")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", name)
          .eq("parent_id", finalParentId)
          .neq("id", existing.id)
      : supabase
          .from("folders")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", name)
          .is("parent_id", null)
          .neq("id", existing.id)
    ).maybeSingle();
    if (duplicate) return jsonError("Another folder already has that name.", 409);
    updates.name = name;
  }
  if (typeof body.color === "string") updates.color = body.color.slice(0, 20);
  if (body.parentId !== undefined) {
    if (body.parentId === null) {
      updates.parent_id = null;
    } else {
      if (body.parentId === existing.id) {
        return jsonError("A folder can’t live inside itself.", 400);
      }
      const { data: allFolders } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id);
      const folders = (allFolders as FolderRecord[] | null) ?? [];
      if (!folders.some((folder) => folder.id === body.parentId)) {
        return jsonError("That parent folder doesn’t exist.", 404);
      }
      const descendants = folderDescendantIds(folders, existing.id);
      if (descendants.includes(body.parentId)) {
        return jsonError("A folder can’t move inside one of its children.", 400);
      }
      updates.parent_id = body.parentId;
    }
  }

  if (!Object.keys(updates).length) {
    return jsonError("No supported changes were provided.");
  }

  const { data, error: updateError } = await supabase
    .from("folders")
    .update(updates)
    .eq("id", existing.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError) return jsonError("Those folder changes could not be saved.", 500);
  return NextResponse.json({ folder: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data: folder } = await supabase
    .from("folders")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!folder) return jsonError("That folder doesn’t exist.", 404);

  const { error: deleteError } = await supabase
    .from("folders")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);
  if (deleteError) return jsonError("That folder could not be deleted.", 500);

  return NextResponse.json({ ok: true });
}
