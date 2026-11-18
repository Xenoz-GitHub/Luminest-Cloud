import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  CalendarDays,
  Download,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FileTypeIcon } from "@/components/files/FileTypeIcon";
import { Mascot } from "@/components/mascot/Mascot";
import { SharePasswordForm } from "@/components/sharing/SharePasswordForm";
import { Logo } from "@/components/ui/Logo";
import { formatBytes, formatDate, formatRelative } from "@/lib/format";
import { resolveShareToken, type ResolvedShare } from "@/lib/sharing/access";
import {
  shareAccessCookieName,
  verifyShareAccessValue,
} from "@/lib/sharing/token";

export const metadata: Metadata = {
  title: "Shared file",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function ShareShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-52 h-72 w-72 rounded-full bg-softBlue/50 blur-3xl"
      />
      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Logo size="sm" />
        <span className="inline-flex items-center gap-1 rounded-full bg-surface/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-line">
          <Sparkles className="h-3 w-3 text-primary-deep dark:text-primary-soft" />
          Shared with care
        </span>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        {children}
      </main>
      <footer className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-10 text-center sm:px-6">
        <p className="text-[11px] leading-relaxed text-muted">
          Made with <span className="font-semibold text-ink">LumiNest</span> —
          your little space for everything.
        </p>
        <Link
          href="/"
          className="mt-1.5 inline-block text-[11px] font-semibold text-primary-deep hover:underline dark:text-primary-soft"
        >
          Make your own little nest
        </Link>
      </footer>
    </div>
  );
}

export default async function PublicSharePage({
  params,
}: {
  params: { token: string };
}) {
  let resolved: ResolvedShare | null = null;
  try {
    resolved = await resolveShareToken(params.token);
  } catch {
    resolved = null;
  }

  if (!resolved) {
    return (
      <ShareShell>
        <div className="rounded-[32px] border border-line bg-surface/90 p-6 text-center shadow-float sm:p-8">
          <Mascot state="file-not-found" size={150} glow className="mx-auto" />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
            Link unavailable
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink">
            This little door has closed
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            The share link may have expired, been revoked, or typed a little
            differently. Ask the person who shared it for a fresh link.
          </p>
        </div>
      </ShareShell>
    );
  }

  const { share, file, admin } = resolved;
  const cookieStore = cookies();
  const unlocked =
    !share.password_hash ||
    verifyShareAccessValue(
      share.id,
      cookieStore.get(shareAccessCookieName(share.id))?.value
    );

  if (!unlocked) {
    return (
      <ShareShell>
        <div className="mb-4 flex flex-col items-center text-center">
          <Mascot expression="shy" size={120} glow />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
            A protected little file
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
            Someone shared something with you
          </h1>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            Enter the password to see the file. The link stays protected.
          </p>
        </div>
        <div className="rounded-[28px] border border-line bg-surface/90 p-5 shadow-float">
          <SharePasswordForm token={params.token} />
        </div>
      </ShareShell>
    );
  }

  const { data: previewRows } = await admin
    .from("file_previews")
    .select("storage_path, page_number")
    .eq("file_id", file.id)
    .eq("user_id", share.user_id)
    .order("page_number", { ascending: true })
    .limit(1);

  let previewUrl: string | null = null;
  const preview = (previewRows ?? [])[0] as
    | { storage_path: string; page_number: number }
    | undefined;
  if (preview?.storage_path) {
    const remainingSeconds = share.expires_at
      ? Math.floor((new Date(share.expires_at).getTime() - Date.now()) / 1000)
      : 600;
    const previewTtl = Math.max(1, Math.min(600, remainingSeconds));
    const { data: signed } = await admin.storage
      .from("previews")
      .createSignedUrl(preview.storage_path, previewTtl);
    previewUrl = signed?.signedUrl ?? null;
  }

  const { data: ownerData } = await admin
    .from("profiles")
    .select("username")
    .eq("id", share.user_id)
    .maybeSingle();
  const ownerName = (ownerData?.username as string | undefined) || "Someone";

  const textPreview = (file.extracted_text ?? "").trim();
  const canDownload = share.allow_download;
  const downloadHref = `/api/share/download/${encodeURIComponent(params.token)}`;
  const isPdf = file.extension === "pdf";

  return (
    <ShareShell>
      <div className="mb-3 flex flex-col items-center text-center">
        <Mascot state="sharing-success" size={112} glow />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
          {ownerName} shared a file with you
        </p>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-line bg-surface/90 shadow-float">
        <div className="border-b border-line/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <FileTypeIcon extension={file.extension} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-2xl">
                {file.name}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                <span>
                  {file.extension.toUpperCase()} · {formatBytes(file.size_bytes)}
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />{" "}
                  {formatRelative(share.created_at)}
                </span>
                {share.expires_at && (
                  <>
                    <span aria-hidden>·</span>
                    <span>Expires {formatDate(share.expires_at)}</span>
                  </>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF3E8] px-2 py-0.5 text-[10px] font-bold text-[#2f7a5c]">
                  <ShieldCheck className="h-2.5 w-2.5" /> Secure link
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                  <Lock className="h-2.5 w-2.5" />
                  {share.password_hash ? "Password protected" : "Private token"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                  {canDownload ? "Download allowed" : "View only"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {previewUrl ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-primary/5 via-surface2 to-softBlue/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`Preview of ${file.name}`}
                className="mx-auto max-h-[64dvh] w-full object-contain"
              />
            </div>
          ) : textPreview ? (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-deep dark:text-primary-soft">
                <FileText className="h-3.5 w-3.5" /> Text preview
              </p>
              <div className="max-h-[52dvh] overflow-auto rounded-2xl border border-line bg-surface2/50 p-4">
                <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-ink">
                  {textPreview.slice(0, 12_000)}
                  {textPreview.length > 12_000 ? "\n\n…" : ""}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary/25 bg-surface2/40 px-5 py-9 text-center">
              <Mascot expression="curious" size={110} animation="float" />
              <p className="mt-1 text-sm font-bold text-ink">
                This file is ready to take with you
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
                {canDownload
                  ? "A visual preview isn’t available for this format, but the original downloads perfectly."
                  : "A visual preview isn’t available, and the owner turned off downloads for this link."}
              </p>
            </div>
          )}

          {previewUrl && isPdf && file.page_count && file.page_count > 1 && (
            <p className="mt-2 text-center text-[10px] text-muted">
              Showing the first of {file.page_count} pages.{" "}
              {canDownload
                ? "Download the original for the full document."
                : "The owner kept this link view-only."}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-4">
            {canDownload ? (
              <a
                href={downloadHref}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
              >
                <Download className="h-4 w-4" /> Download original
              </a>
            ) : (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface2 px-4 text-xs font-semibold text-muted">
                <Lock className="h-3.5 w-3.5" /> View only — downloads are off
              </span>
            )}
            <p className="text-[10px] text-muted">
              {file.extension.toUpperCase()} · {formatBytes(file.size_bytes)}
            </p>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-md text-center text-[10px] leading-relaxed text-muted">
        This page was made just for this share link. If it wasn’t meant for you,
        you can safely close it. Downloads are checked against the link’s expiry,
        revocation and password on the server.
      </p>
    </ShareShell>
  );
}
