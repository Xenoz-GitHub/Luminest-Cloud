import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson, requestIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import type { Review } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const { error, supabase } = await requireApiUser();
  if (error || !supabase) return error;

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json({ reviews: (data as Review[] | null) ?? [] });
}

interface ReviewBody {
  rating?: number;
  title?: string | null;
  body?: string;
}

export async function POST(request: Request) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const limit = rateLimit(`review:${user.id}:${requestIp(request)}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return jsonError(
      `Give it a moment before posting again (${limit.retryAfterSeconds}s).`,
      429
    );
  }

  const payload = await readJson<ReviewBody>(request);
  if (!payload) return jsonError("The review was empty.");

  const rating = Math.round(Number(payload.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return jsonError("Choose a rating from 1 to 5 stars.");
  }

  const body = (payload.body ?? "").trim();
  if (body.length < 10) {
    return jsonError("Tell us a little more — at least 10 characters.");
  }
  if (body.length > 2000) {
    return jsonError("That review is a bit too long. Keep it under 2000 characters.");
  }

  const title = (payload.title ?? "").trim().slice(0, 100) || null;

  // Snapshot the display name so the public list does not need a join.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  const displayName =
    ((profile?.username as string | undefined) ?? "")
      .trim()
      .slice(0, 60) || "LumiNest friend";

  const { data, error: upsertError } = await supabase
    .from("reviews")
    .upsert(
      {
        user_id: user.id,
        rating,
        title,
        body,
        display_name: displayName,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (upsertError) {
    console.error("[reviews] upsert failed:", upsertError.code, upsertError.message);
    return jsonError("Your review could not be saved just now.", 500);
  }

  return NextResponse.json({ review: data as Review });
}

export async function DELETE() {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { error: deleteError } = await supabase
    .from("reviews")
    .delete()
    .eq("user_id", user.id);
  if (deleteError) return jsonError("Your review could not be removed.", 500);
  return NextResponse.json({ ok: true });
}
