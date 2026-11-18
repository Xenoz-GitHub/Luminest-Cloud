import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/http";
import { buildShareUrl, createShareToken } from "@/lib/sharing/token";
import type {
  FilePreview,
  FileRecord,
  FileSummary,
  FolderRecord,
  ShareLink,
  TagRecord,
} from "@/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data: fileData } = await supabase
    .from("files")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const file = fileData as FileRecord | null;
  if (!file) return jsonError("That file doesn’t exist.", 404);

  const { data: previewData } = await supabase
    .from("file_previews")
    .select("*")
    .eq("file_id", file.id)
    .eq("user_id", user.id)
    .order("page_number", { ascending: true });
  const previews = (previewData as FilePreview[] | null) ?? [];

  let previewUrls: { pageNumber: number; url: string; previewType: string }[] = [];
  if (previews.length) {
    const { data: signed } = await supabase.storage
      .from("previews")
      .createSignedUrls(
        previews.map((preview) => preview.storage_path),
        3600
      );
    previewUrls = previews
      .map((preview, index) => ({
        pageNumber: preview.page_number,
        previewType: preview.preview_type,
        url: signed?.[index]?.signedUrl ?? "",
      }))
      .filter((preview) => preview.url);
  }

  const { data: summaryData } = await supabase
    .from("file_summaries")
    .select("*")
    .eq("file_id", file.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const summary = summaryData as FileSummary | null;

  const { data: tagRows } = await supabase
    .from("file_tags")
    .select("tag_id, tags(*)")
    .eq("file_id", file.id);
  const tags = ((tagRows ?? []) as { tags: TagRecord | TagRecord[] | null }[])
    .flatMap((row) => (Array.isArray(row.tags) ? row.tags : row.tags ? [row.tags] : []));

  const { data: folderData } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });
  const folders = (folderData as FolderRecord[] | null) ?? [];

  const { data: shareData } = await supabase
    .from("share_links")
    .select("*")
    .eq("file_id", file.id)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const share = shareData as ShareLink | null;
  const activeShare = share
    ? {
        id: share.id,
        url: buildShareUrl(createShareToken(share.id)),
        expiresAt: share.expires_at,
        allowDownload: share.allow_download,
        hasPassword: Boolean(share.password_hash),
        createdAt: share.created_at,
        isExpired: share.expires_at
          ? new Date(share.expires_at).getTime() <= Date.now()
          : false,
      }
    : null;

  return NextResponse.json({
    file,
    previews: previewUrls,
    summary,
    tags,
    folders,
    activeShare,
  });
}
