import { NextResponse } from "next/server";
import { jsonError, readJson, requestIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { resolveShareToken } from "@/lib/sharing/access";
import {
  createShareAccessValue,
  shareAccessCookieName,
  verifySharePassword,
} from "@/lib/sharing/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(`share-unlock:${requestIp(request)}`, 12, 60_000);
  if (!limit.ok) {
    return jsonError("Too many attempts. Wait a moment and try again.", 429);
  }

  const body = await readJson<{ token?: string; password?: string }>(request);
  if (!body?.token || !body.password) {
    return jsonError("Enter the password for this link.", 400);
  }

  try {
    const resolved = await resolveShareToken(body.token);
    if (!resolved) return jsonError("That link is no longer available.", 404);
    const { share } = resolved;

    if (!share.password_hash) {
      return NextResponse.json({ ok: true });
    }
    if (!verifySharePassword(body.password, share.password_hash)) {
      return jsonError("That password isn’t right.", 401);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      shareAccessCookieName(share.id),
      createShareAccessValue(share.id),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60,
      }
    );
    return response;
  } catch {
    return jsonError("That link could not be opened right now.", 500);
  }
}
