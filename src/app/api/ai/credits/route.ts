import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/http";
import { getCreditStatus } from "@/lib/ai/credits";
import { isAIConfigured } from "@/lib/ai";

export const runtime = "nodejs";

/** Returns the signed-in user's current AI credit window. */
export async function GET() {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const planId = (data?.plan as string | undefined) ?? "free";

  const credits = await getCreditStatus(user.id, planId);
  return NextResponse.json({ credits, aiAvailable: isAIConfigured() });
}
