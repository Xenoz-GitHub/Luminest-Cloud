import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/http";
import { resolveShareToken } from "@/lib/sharing/access";
import { buildSignedImageUrl } from "@/lib/imagekit";
import {
  shareAccessCookieName,
  verifyShareAccessValue,
} from "@/lib/sharing/token";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const resolved = await resolveShareToken(params.token);
    if (!resolved) return jsonError("That link is no longer available.", 404);
    const { share, file, admin } = resolved;

    if (!share.allow_download) {
      return jsonError("The owner turned off downloads for this link.", 403);
    }

    if (share.password_hash) {
      const cookie = request.cookies.get(shareAccessCookieName(share.id))?.value;
      if (!verifyShareAccessValue(share.id, cookie)) {
        return jsonError("Enter the link password to download this file.", 401);
      }
    }

    if (file.storage_provider === "imagekit") {
      const url = buildSignedImageUrl(file.storage_path, {
        ttlSeconds: 60,
        attachment: true,
      });
      if (!url) return jsonError("The download could not be prepared.", 500);
      return NextResponse.redirect(url, { status: 302 });
    }

    const { data: signed, error } = await admin.storage
      .from("files")
      .createSignedUrl(file.storage_path, 60, {
        download: file.original_filename,
      });
    if (error || !signed?.signedUrl) {
      return jsonError("The download could not be prepared.", 500);
    }

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch {
    return jsonError("The download could not be prepared right now.", 500);
  }
}
