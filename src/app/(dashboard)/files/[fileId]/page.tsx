import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  HardDrive,
  Layers,
  Link2,
  Sparkles,
  Tag,
} from "lucide-react";
import { DocumentViewer } from "@/components/preview/DocumentViewer";
import { FileActions } from "@/components/files/FileActions";
import { FileTypeIcon } from "@/components/files/FileTypeIcon";
import { SummaryPanel } from "@/components/files/SummaryPanel";
import { TagEditor } from "@/components/files/TagEditor";
import { TrashList } from "@/components/files/TrashList";
import { Card } from "@/components/ui/Card";
import { getProfile } from "@/lib/auth";
import { buildBreadcrumbs, fetchFileOwned } from "@/lib/data";
import {
  formatBytes,
  formatDate,
  formatRelative,
  getCategoryLabel,
} from "@/lib/format";
import { createShareToken, buildShareUrl } from "@/lib/sharing/token";
import type {
  FilePreview,
  FileSummary,
  FolderRecord,
  ShareDto,
  ShareLink,
  TagRecord,
} from "@/types";

export const metadata: Metadata = { title: "File details" };
export const dynamic = "force-dynamic";

const PREVIEW_LABEL: Record<string, string> = {
  pending: "Waiting to process",
  queued: "Queued for preview",
  processing: "Making a preview",
  ready: "Preview ready",
  failed: "Preview needs a retry",
  unsupported: "Download only",
};

export default async function FileDetailPage({
  params,
}: {
  params: { fileId: string };
}) {
  const { user, supabase } = await getProfile();
  const file = await fetchFileOwned(supabase, params.fileId, user.id);
  if (!file) notFound();

  const [
    { data: previewData },
    { data: summaryData },
    { data: folderData },
    { data: tagData },
    { data: fileTagData },
    { data: shareData },
  ] = await Promise.all([
    supabase
      .from("file_previews")
      .select("*")
      .eq("file_id", file.id)
      .eq("user_id", user.id)
      .order("page_number", { ascending: true }),
    supabase
      .from("file_summaries")
      .select("*")
      .eq("file_id", file.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase.from("file_tags").select("tag_id, tags(*)").eq("file_id", file.id),
    supabase
      .from("share_links")
      .select("*")
      .eq("file_id", file.id)
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const folders = (folderData as FolderRecord[] | null) ?? [];
  const allTags = (tagData as TagRecord[] | null) ?? [];
  const fileTags = (
    (fileTagData ?? []) as { tags: TagRecord | TagRecord[] | null }[]
  ).flatMap((row) =>
    Array.isArray(row.tags) ? row.tags : row.tags ? [row.tags] : []
  );
  const summary = summaryData as FileSummary | null;
  const share = shareData as ShareLink | null;

  const activeShare: ShareDto | null = share
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

  const previews = (previewData as FilePreview[] | null) ?? [];
  let previewUrls: { pageNumber: number; url: string; previewType: string }[] =
    [];
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

  const folderChain = file.folder_id
    ? buildBreadcrumbs(folders, file.folder_id)
    : [];
  const extractedCharacters = (file.extracted_text ?? "").trim().length;

  const titleBlock = (
    <div className="flex items-start gap-3">
      <FileTypeIcon extension={file.extension} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-deep dark:text-primary-soft">
            {getCategoryLabel(file.extension)}
          </span>
          <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
            .{file.extension}
          </span>
          {file.is_favorite && (
            <span className="rounded-full bg-[#F7DCE8] px-2 py-0.5 text-[10px] font-bold text-[#a34b60]">
              Favorite
            </span>
          )}
          {activeShare && !activeShare.isExpired && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF3E8] px-2 py-0.5 text-[10px] font-bold text-[#2f7a5c]">
              <Link2 className="h-2.5 w-2.5" /> Shared
            </span>
          )}
        </div>
        <h1 className="mt-1.5 break-words text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-2xl">
          {file.name}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <HardDrive className="h-3 w-3" /> {formatBytes(file.size_bytes)}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> {formatDate(file.created_at)}
          </span>
          {file.page_count ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3 w-3" /> {file.page_count}{" "}
                {file.page_count === 1 ? "page" : "pages"}
              </span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span>{PREVIEW_LABEL[file.preview_status] ?? "Processing"}</span>
        </p>
      </div>
    </div>
  );

  if (file.deleted_at) {
    return (
      <div className="space-y-5">
        <Link
          href="/files?trash=1"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to the bin
        </Link>
        {titleBlock}
        <div className="rounded-3xl border border-[#E892A2]/40 bg-[#E892A2]/10 p-4">
          <p className="text-sm font-bold text-[#a34b60] dark:text-[#f3b3c0]">
            This file is in the bin
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Restore it to preview, summarize, tag or share it again. Files are
            only deleted from storage when you choose “Delete forever”.
          </p>
        </div>
        <Card className="p-4">
          <TrashList files={[file]} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href={file.folder_id ? `/files?folder=${file.folder_id}` : "/files"}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to my files
      </Link>

      {titleBlock}

      {folderChain.length > 0 && (
        <nav
          aria-label="Folder location"
          className="flex flex-wrap items-center gap-1 text-[11px] text-muted"
        >
          <Link
            href="/files"
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold transition hover:bg-surface2 hover:text-ink"
          >
            <FolderOpen className="h-3 w-3" /> All files
          </Link>
          {folderChain.map((folder) => (
            <span key={folder.id} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted/60" />
              <Link
                href={`/files?folder=${folder.id}`}
                className="rounded-full px-2 py-0.5 font-semibold transition hover:bg-surface2 hover:text-ink"
              >
                {folder.name}
              </Link>
            </span>
          ))}
        </nav>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-3 sm:p-4">
            <DocumentViewer file={file} previews={previewUrls} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
              <a
                href={`/api/files/${file.id}/download`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
              >
                <Download className="h-3.5 w-3.5" /> Download original
              </a>
              <p className="text-[10px] text-muted">
                Original {file.extension.toUpperCase()} ·{" "}
                {formatBytes(file.size_bytes)}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-deep dark:text-primary-soft">
              <FileText className="h-3.5 w-3.5" /> File details
            </p>
            <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-muted">Original name</dt>
                <dd className="mt-0.5 break-all font-semibold text-ink">
                  {file.original_filename}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Type</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {file.mime_type || getCategoryLabel(file.extension)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Uploaded</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {formatRelative(file.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Last changed</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {formatRelative(file.updated_at)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Extracted text</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {extractedCharacters
                    ? `${extractedCharacters.toLocaleString()} characters`
                    : "Not available"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Summary</dt>
                <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold text-ink">
                  <Sparkles className="h-3 w-3 text-primary-deep dark:text-primary-soft" />
                  {summary?.status === "ready" ? "Ready" : "Not generated"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Folder</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {folderChain.length
                    ? folderChain.map((folder) => folder.name).join(" / ")
                    : "No folder"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Preview</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {PREVIEW_LABEL[file.preview_status] ?? "Processing"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-deep dark:text-primary-soft">
              Actions
            </p>
            <FileActions
              file={file}
              folders={folders}
              initialShare={activeShare}
              layout="row"
              showOpen={false}
            />
            {activeShare && !activeShare.isExpired && (
              <Link
                href={activeShare.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-deep hover:underline dark:text-primary-soft"
              >
                <Link2 className="h-3 w-3" /> Open the public share page
              </Link>
            )}
          </Card>

          <Card className="p-4">
            <SummaryPanel
              fileId={file.id}
              fileName={file.name}
              initialSummary={
                summary && summary.status === "ready" ? summary : null
              }
              hasExtractedText={extractedCharacters > 0}
              extractedCharacters={extractedCharacters}
              extractedText={file.extracted_text}
            />
          </Card>

          <Card className="p-4">
            <TagEditor
              fileId={file.id}
              initialTags={fileTags}
              allTags={allTags}
            />
          </Card>

          {!extractedCharacters && (
            <Card className="flex items-start gap-3 border-dashed p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-cream text-[#8a6414]">
                <Tag className="h-4 w-4" />
              </span>
              <p className="text-[11px] leading-relaxed text-muted">
                Tips: tags make files easier to find, and text-based PDFs, DOCX
                and TXT files can be summarized with Lumi.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
