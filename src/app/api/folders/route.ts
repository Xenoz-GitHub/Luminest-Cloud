import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson } from "@/lib/http";
import { FOLDER_COLORS } from "@/lib/constants";
import type { FolderRecord } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });
  return NextResponse.json({ folders: (data as FolderRecord[] | null) ?? [] });
}

export async function POST(request: Request) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const body = await readJson<{
    name?: string;
    parentId?: string | null;
    color?: string;
  }>(request);
  const name = body?.name?.trim().slice(0, 80);
  if (!name) return jsonError("Give your folder a name.");

  const parentId = body?.parentId || null;
  if (parentId) {
    const { data: parent } = await supabase
      .from("folders")
      .select("id")
      .eq("id", parentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!parent) return jsonError("That parent folder doesn’t exist.", 404);
  }

  const { data: duplicate } = await (parentId
    ? supabase
        .from("folders")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", name)
        .eq("parent_id", parentId)
    : supabase
        .from("folders")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", name)
        .is("parent_id", null)
  ).maybeSingle();
  if (duplicate) {
    return jsonError("A folder with that name already lives here.", 409);
  }

  const { data, error: insertError } = await supabase
    .from("folders")
    .insert({
      user_id: user.id,
      name,
      parent_id: parentId,
      color: body?.color || FOLDER_COLORS[0],
    })
    .select("*")
    .single();

  if (insertError) return jsonError("That folder could not be created.", 500);
  return NextResponse.json({ folder: data });
}
