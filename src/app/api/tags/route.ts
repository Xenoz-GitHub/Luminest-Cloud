import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson } from "@/lib/http";
import type { TagRecord } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });
  return NextResponse.json({ tags: (data as TagRecord[] | null) ?? [] });
}

export async function POST(request: Request) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const body = await readJson<{ name?: string; color?: string }>(request);
  const name = body?.name?.trim().slice(0, 40);
  if (!name) return jsonError("Give the tag a short name.");

  const { data: existing } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .ilike("name", name)
    .maybeSingle();
  if (existing) return NextResponse.json({ tag: existing });

  const { data, error: insertError } = await supabase
    .from("tags")
    .insert({
      user_id: user.id,
      name,
      color: body?.color?.slice(0, 20) || "#B9A5EA",
    })
    .select("*")
    .single();

  if (insertError) return jsonError("That tag could not be created.", 500);
  return NextResponse.json({ tag: data });
}
