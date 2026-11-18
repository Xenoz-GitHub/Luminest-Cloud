import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const body = await readJson<{ tagId?: string; action?: "add" | "remove" }>(
    request
  );
  if (!body?.tagId) return jsonError("Choose a tag first.");

  const [{ data: file }, { data: tag }] = await Promise.all([
    supabase
      .from("files")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("tags")
      .select("id")
      .eq("id", body.tagId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!file) return jsonError("That file doesn’t exist.", 404);
  if (!tag) return jsonError("That tag doesn’t exist.", 404);

  if (body.action === "remove") {
    const { error: removeError } = await supabase
      .from("file_tags")
      .delete()
      .eq("file_id", file.id)
      .eq("tag_id", tag.id);
    if (removeError) return jsonError("The tag could not be removed.", 500);
  } else {
    const { error: addError } = await supabase
      .from("file_tags")
      .insert({ file_id: file.id, tag_id: tag.id });
    if (addError && addError.code !== "23505") {
      return jsonError("The tag could not be added.", 500);
    }
  }

  return NextResponse.json({ ok: true });
}
