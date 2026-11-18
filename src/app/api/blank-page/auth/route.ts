import { NextResponse } from "next/server";
import { requestIp, readJson, jsonError } from "@/lib/http";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  audit,
  createAdminSession,
  isAdminConfigured,
  isSameOrigin,
  checkThrottle,
  recordLoginAttempt,
  verifyAdminPin,
} from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Unlock the admin panel with the configured PIN. */
export async function POST(request: Request) {
  const ip = requestIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!isSameOrigin(request)) {
    return jsonError("This request could not be verified.", 403);
  }

  if (!isAdminConfigured()) {
    return jsonError(
      "Admin access is not configured on this deployment.",
      503
    );
  }

  // Throttle before touching the PIN so guesses cost nothing to reject.
  const throttle = await checkThrottle(ip);
  if (throttle === "unavailable") {
    // Fail closed, but say what is actually wrong: without the tables we
    // cannot rate-limit, and silently allowing unlimited guesses would be
    // worse than refusing to open.
    return jsonError(
      "Admin storage is not ready on this deployment. Apply the admin_panel migration, then try again.",
      503
    );
  }
  if (throttle === "limited") {
    await audit("auth.blocked", { ip, userAgent, success: false });
    return jsonError(
      "Too many attempts. Wait 15 minutes before trying again.",
      429
    );
  }

  const body = await readJson<{ pin?: string }>(request);
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!pin || pin.length > 200) {
    await recordLoginAttempt(ip, false);
    await audit("auth.failed", { ip, userAgent, success: false });
    return jsonError("That PIN is not correct.", 401);
  }

  if (!verifyAdminPin(pin)) {
    await recordLoginAttempt(ip, false);
    await audit("auth.failed", { ip, userAgent, success: false });
    // Deliberately generic: no signal about how close the guess was.
    return jsonError("That PIN is not correct.", 401);
  }

  await recordLoginAttempt(ip, true);
  await audit("auth.success", { ip, userAgent });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return response;
}

/** Lock the panel (clears the session cookie). */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("This request could not be verified.", 403);
  }
  await audit("auth.logout", { ip: requestIp(request) });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
