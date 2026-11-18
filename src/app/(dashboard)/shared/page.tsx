import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, Link2, Lock, ShieldCheck } from "lucide-react";
import { SharedLinksList, type SharedLinkItem } from "@/components/sharing/SharedLinksList";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProfile } from "@/lib/auth";
import { buildShareUrl, createShareToken } from "@/lib/sharing/token";
import type { FileRecord, ShareLink } from "@/types";

export const metadata: Metadata = { title: "Shared" };
export const dynamic = "force-dynamic";

export default async function SharedPage() {
  const { user, supabase } = await getProfile();

  const { data: shareData } = await supabase
    .from("share_links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const shares = (shareData as ShareLink[] | null) ?? [];
  const fileIds = [...new Set(shares.map((share) => share.file_id))];

  const { data: fileData } = fileIds.length
    ? await supabase
        .from("files")
        .select("id, name, extension, size_bytes, created_at, deleted_at")
        .eq("user_id", user.id)
        .in("id", fileIds)
    : { data: [] };

  const files = new Map(
    ((fileData ?? []) as Pick<
      FileRecord,
      "id" | "name" | "extension" | "size_bytes" | "created_at" | "deleted_at"
    >[]).map((file) => [file.id, file])
  );

  const items: SharedLinkItem[] = [];
  for (const share of shares) {
    const file = files.get(share.file_id);
    if (!file) continue;
    const expired = share.expires_at
      ? new Date(share.expires_at).getTime() <= Date.now()
      : false;
    items.push({
      share: {
        id: share.id,
        url: buildShareUrl(createShareToken(share.id)),
        expiresAt: share.expires_at,
        allowDownload: share.allow_download,
        hasPassword: Boolean(share.password_hash),
        createdAt: share.created_at,
        isExpired: expired,
      },
      file,
      status: share.revoked_at ? "revoked" : expired ? "expired" : "active",
    });
  }

  // Active links first, then most recent history.
  items.sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return new Date(b.share.createdAt).getTime() - new Date(a.share.createdAt).getTime();
  });

  const activeCount = items.filter((item) => item.status === "active").length;
  const protectedCount = items.filter(
    (item) => item.status === "active" && item.share.hasPassword
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
            Little doors you opened
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Shared
          </h1>
          <p className="mt-1 text-sm text-muted">
            Every branded link you have made, in one calm place.
          </p>
        </div>
        <Link
          href="/files"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          <FolderOpen className="h-3.5 w-3.5" /> Choose a file
        </Link>
      </div>

      {items.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          <Card className="flex items-center gap-3 p-3.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-primary-deep dark:text-primary-soft">
              <Link2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-none text-ink">
                {activeCount}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                active {activeCount === 1 ? "link" : "links"}
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-3.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-softBlue text-[#356b96]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-none text-ink">
                {items.length}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">links all time</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-3.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cream text-[#8a6414]">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-none text-ink">
                {protectedCount}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                password protected
              </p>
            </div>
          </Card>
        </div>
      )}

      <Card className="border-primary/20 bg-primary/5 p-3.5">
        <p className="text-[11px] leading-relaxed text-muted">
          Share pages are branded LumiNest pages with a secure token. Recipients
          never see your storage bucket or account details. Expired, revoked and
          password-protected links are enforced on the server.
        </p>
      </Card>

      {items.length ? (
        <SharedLinksList items={items} />
      ) : (
        <EmptyState
          state="sharing-success"
          title="Nothing shared yet"
          description="Open any file and choose Share to make a little branded page for it. You can set an expiry, a password and whether downloads are allowed."
          action={
            <Link
              href="/files"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
            >
              <FolderOpen className="h-4 w-4" /> Go to my files
            </Link>
          }
        />
      )}
    </div>
  );
}
