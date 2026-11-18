import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseShareToken, verifyShareToken } from "@/lib/sharing/token";
import type { FileRecord, ShareLink } from "@/types";

export interface ResolvedShare {
  share: ShareLink;
  file: FileRecord;
  admin: SupabaseClient;
}

/**
 * Resolves a public share token using the service-role client. No user id or
 * storage path is ever accepted from the browser. Returns null for missing,
 * revoked, expired or mismatched links so callers can respond identically.
 */
export async function resolveShareToken(
  token: string
): Promise<ResolvedShare | null> {
  const shareId = parseShareToken(token);
  if (!shareId) return null;

  const admin = createAdminClient();
  const { data: shareData } = await admin
    .from("share_links")
    .select("*")
    .eq("id", shareId)
    .maybeSingle();
  const share = shareData as ShareLink | null;
  if (!share) return null;
  if (share.revoked_at) return null;
  if (share.expires_at && new Date(share.expires_at).getTime() <= Date.now()) {
    return null;
  }
  if (!verifyShareToken(token, share.token_hash)) return null;

  const { data: fileData } = await admin
    .from("files")
    .select("*")
    .eq("id", share.file_id)
    .eq("user_id", share.user_id)
    .maybeSingle();
  const file = fileData as FileRecord | null;
  if (!file || file.deleted_at) return null;

  return { share, file, admin };
}
