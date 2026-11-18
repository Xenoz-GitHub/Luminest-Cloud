import { createAdminClient, hasAdminConfig } from "@/lib/supabase/admin";
import { AI_CREDIT_COSTS, getAIPlan } from "@/lib/constants";
import type { AiCreditStatus } from "@/types";

/**
 * AI credit accounting. Each plan defines a credit budget per rolling window
 * (default 2 hours). The default "free" plan lives in constants; future paid
 * plans only need a new entry there plus a profiles.plan value. Consumption is
 * atomic via the consume_ai_credits() DB function so concurrent requests cannot
 * overspend.
 */

/** Cost of one summary; grows a little for very large documents, capped at 5. */
export function summaryCreditCost(extractedChars: number): number {
  const base = AI_CREDIT_COSTS.summary;
  const extra =
    extractedChars > 20_000
      ? Math.ceil((extractedChars - 20_000) / 20_000)
      : 0;
  return Math.max(1, Math.min(base + extra, 5));
}

function freshStatus(planId?: string | null): AiCreditStatus {
  const plan = getAIPlan(planId);
  return {
    plan: plan.id,
    limit: plan.creditsPerWindow,
    used: 0,
    remaining: plan.creditsPerWindow,
    resetAt: new Date(Date.now() + plan.windowSeconds * 1000).toISOString(),
    windowSeconds: plan.windowSeconds,
  };
}

/** Read the current window state without consuming anything. */
export async function getCreditStatus(
  userId: string,
  planId?: string | null
): Promise<AiCreditStatus> {
  const plan = getAIPlan(planId);
  const fallback = freshStatus(planId);
  if (!hasAdminConfig()) return fallback;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("ai_credits")
      .select("window_start, used")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return fallback;

    const windowStart = new Date(data.window_start as string).getTime();
    const resetAtMs = windowStart + plan.windowSeconds * 1000;
    if (Date.now() >= resetAtMs) {
      return {
        ...fallback,
        remaining: plan.creditsPerWindow,
        resetAt: new Date(Date.now() + plan.windowSeconds * 1000).toISOString(),
      };
    }

    const used = Math.max(0, Math.min(plan.creditsPerWindow, Number(data.used) || 0));
    return {
      plan: plan.id,
      limit: plan.creditsPerWindow,
      used,
      remaining: Math.max(0, plan.creditsPerWindow - used),
      resetAt: new Date(resetAtMs).toISOString(),
      windowSeconds: plan.windowSeconds,
    };
  } catch {
    return fallback;
  }
}

/**
 * Atomically consume credits. If the database is not configured yet (migration
 * not applied), this fails open so summarization keeps working while the admin
 * can apply the migration — the in-memory endpoint rate limiter still applies.
 */
/**
 * Give credits back after a failed AI attempt so users aren't charged for
 * work that never produced a summary. Safe to call with any amount; never
 * drops usage below zero.
 */
export async function refundSummaryCredits(
  userId: string,
  amount: number
): Promise<void> {
  const safeAmount = Math.max(1, Math.round(amount));
  if (!hasAdminConfig()) return;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("ai_credits")
      .select("used")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return;
    const nextUsed = Math.max(0, Number(data.used) - safeAmount);
    await admin
      .from("ai_credits")
      .update({ used: nextUsed, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  } catch {
    // Refund is best-effort; never block the error response.
  }
}

export async function consumeSummaryCredits(
  userId: string,
  planId: string | null | undefined,
  amount: number
): Promise<{ allowed: boolean; status: AiCreditStatus }> {
  const plan = getAIPlan(planId);
  const safeAmount = Math.max(1, Math.round(amount));

  if (!hasAdminConfig()) {
    return { allowed: true, status: await getCreditStatus(userId, planId) };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_ai_credits", {
      p_user_id: userId,
      p_amount: safeAmount,
      p_limit: plan.creditsPerWindow,
      p_window_seconds: plan.windowSeconds,
    });
    if (error) throw error;

    const row = (Array.isArray(data) ? data[0] : data) as
      | { allowed: boolean; used: number; remaining: number; reset_at: string }
      | null;
    if (!row) throw new Error("The credit function returned no result.");

    return {
      allowed: Boolean(row.allowed),
      status: {
        plan: plan.id,
        limit: plan.creditsPerWindow,
        used: Number(row.used) || 0,
        remaining: Math.max(0, Number(row.remaining) || 0),
        resetAt: row.reset_at,
        windowSeconds: plan.windowSeconds,
      },
    };
  } catch {
    // Fail open (rate limiter still protects the endpoint).
    return { allowed: true, status: await getCreditStatus(userId, planId) };
  }
}
