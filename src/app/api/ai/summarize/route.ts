import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson, requestIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { isAIConfigured } from "@/lib/ai";
import { AIConfigurationError } from "@/lib/ai/provider";
import { summarizeDocument } from "@/lib/ai/summarizer";
import {
  consumeSummaryCredits,
  getCreditStatus,
  refundSummaryCredits,
  summaryCreditCost,
} from "@/lib/ai/credits";
import type { FileRecord } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const limit = rateLimit(
    `summary:${user.id}:${requestIp(request)}`,
    12,
    10 * 60_000
  );
  if (!limit.ok) {
    return jsonError(
      `Lumi needs a short break. Try again in ${limit.retryAfterSeconds}s.`,
      429
    );
  }

  // No AI provider is not an error: the local extractive engine still works.
  const aiAvailable = isAIConfigured();

  const body = await readJson<{ fileId?: string }>(request);
  if (!body?.fileId) return jsonError("Choose a file to summarize.");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const planId = (profileRow?.plan as string | undefined) ?? "free";

  const { data } = await supabase
    .from("files")
    .select("*")
    .eq("id", body.fileId)
    .eq("user_id", user.id)
    .maybeSingle();
  const file = data as FileRecord | null;
  if (!file) return jsonError("That file doesn’t exist.", 404);
  if (file.deleted_at) return jsonError("That file is in the bin.", 410);
  if (file.preview_status === "processing" || file.summary_status === "processing") {
    return jsonError("Lumi is already working on this file. Give her a moment.", 409);
  }

  // Credits only apply to paid AI calls. The local engine is free, so when no
  // AI is configured the reservation is skipped entirely.
  const cost = summaryCreditCost((file.extracted_text ?? "").trim().length);
  const reservation = aiAvailable
    ? await consumeSummaryCredits(user.id, planId, cost)
    : null;
  if (reservation && !reservation.allowed) {
    return NextResponse.json(
      {
        error: `You are out of AI credits for now. Your free ${reservation.status.limit}-credit budget resets soon.`,
        credits: reservation.status,
      },
      { status: 429 }
    );
  }

  try {
    const result = await summarizeDocument({ supabase, file, userId: user.id });

    // If the AI call failed and the local engine wrote the summary, no paid
    // work happened — return the reserved credits.
    let credits;
    if (reservation && result.usedLocal) {
      await refundSummaryCredits(user.id, cost);
      credits = await getCreditStatus(user.id, planId);
    } else {
      credits = reservation?.status ?? (await getCreditStatus(user.id, planId));
    }

    return NextResponse.json({
      credits,
      offline: result.usedLocal,
      summary: {
        overview: result.content.overview,
        mainIdeas: result.content.mainIdeas,
        importantPoints: result.content.importantPoints,
        keyTerms: result.content.keyTerms,
        importantDates: result.content.importantDates,
        conclusions: result.content.conclusions,
        pageReferences: result.content.pageReferences,
        summaryText: result.summaryText,
        provider: result.provider,
        model: result.model,
        generatedAt: result.generatedAt,
      },
    });
  } catch (err) {
    const message =
      err instanceof AIConfigurationError
        ? err.message
        : err instanceof Error
          ? err.message
          : "The summary could not be generated.";
    const status = err instanceof AIConfigurationError ? 503 : 502;
    // The summary never completed, so return the reserved credits. Only a
    // successful summary should count against the user's budget.
    await refundSummaryCredits(user.id, cost);
    const credits = await getCreditStatus(user.id, planId);
    return NextResponse.json({ error: message, credits }, { status });
  }
}
