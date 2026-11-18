import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireApiUser, jsonError, readJson, requestIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildShareUrl,
  createShareToken,
  hashSharePassword,
  hashShareToken,
} from "@/lib/sharing/token";
import type { FileRecord } from "@/types";

export const runtime = "nodejs";

interface ShareBody {
  fileId?: string;
  expiresIn?: "1d" | "7d" | "30d" | "never";
  expiresAt?: string | null;
  allowDownload?: boolean;
  password?: string | null;
}

function resolveExpiry(body: ShareBody): Date | null {
  if (body.expiresAt) {
    const date = new Date(body.expiresAt);
    if (Number.isNaN(date.getTime())) return null;
    const max = Date.now() + 366 * 24 * 60 * 60 * 1000;
    if (date.getTime() <= Date.now()) return null;
    return new Date(Math.min(date.getTime(), max));
  }
  const days =
    body.expiresIn === "1d"
      ? 1
      : body.expiresIn === "30d"
        ? 30
        : body.expiresIn === "never"
          ? 0
          : 7;
  if (!days) return null;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function POST(request: Request) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const limit = rateLimit(
    `share-create:${user.id}:${requestIp(request)}`,
    20,
    60 * 60_000
  );
  if (!limit.ok) {
    return jsonError("Too many share links created. Try again later.", 429);
  }

  const body = await readJson<ShareBody>(request);
  if (!body?.fileId) return jsonError("Choose a file to share.");

  const { data } = await supabase
    .from("files")
    .select("*")
    .eq("id", body.fileId)
    .eq("user_id", user.id)
    .maybeSingle();
  const file = data as FileRecord | null;
  if (!file) return jsonError("That file doesn’t exist.", 404);
  if (file.deleted_at) return jsonError("Restore that file before sharing it.", 410);

  const password = body.password?.trim() || null;
  if (password && (password.length < 4 || password.length > 100)) {
    return jsonError("Share passwords must be 4–100 characters.", 400);
  }

  // One active link per file: retire any previous active link first.
  await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("file_id", file.id)
    .eq("user_id", user.id)
    .is("revoked_at", null);

  const shareId = randomUUID();
  const token = createShareToken(shareId);
  const expiresAt = resolveExpiry(body);

  const { data: share, error: insertError } = await supabase
    .from("share_links")
    .insert({
      id: shareId,
      file_id: file.id,
      user_id: user.id,
      token_hash: hashShareToken(token),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      password_hash: password ? hashSharePassword(password) : null,
      allow_download: body.allowDownload !== false,
    })
    .select("*")
    .single();

  if (insertError || !share) {
    return jsonError("That share link could not be created.", 500);
  }

  return NextResponse.json({
    share: {
      id: share.id,
      url: buildShareUrl(token),
      expiresAt: share.expires_at,
      allowDownload: share.allow_download,
      hasPassword: Boolean(share.password_hash),
      createdAt: share.created_at,
      isExpired: false,
    },
  });
}
