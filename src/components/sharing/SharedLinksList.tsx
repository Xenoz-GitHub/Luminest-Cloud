"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Lock,
  RefreshCw,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { FileTypeIcon } from "@/components/files/FileTypeIcon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatBytes, formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ShareDto } from "@/types";

export interface SharedLinkItem {
  share: ShareDto;
  file: {
    id: string;
    name: string;
    extension: string;
    size_bytes: number;
    created_at: string;
    deleted_at: string | null;
  };
  status: "active" | "expired" | "revoked";
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

const STATUS_STYLE: Record<SharedLinkItem["status"], string> = {
  active: "bg-[#DDF3E8] text-[#2f7a5c]",
  expired: "bg-cream text-[#8a6414]",
  revoked: "bg-surface2 text-muted",
};

const STATUS_LABEL: Record<SharedLinkItem["status"], string> = {
  active: "Active",
  expired: "Expired",
  revoked: "Revoked",
};

export function SharedLinksList({ items }: { items: SharedLinkItem[] }) {
  const router = useRouter();
  const [links, setLinks] = useState(items);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<SharedLinkItem | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy(link: SharedLinkItem) {
    setError(null);
    const ok = await copyText(link.share.url);
    if (ok) {
      setCopiedId(link.share.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } else {
      setError("Copying was blocked. Select the link from the file page instead.");
    }
  }

  async function revoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    setError(null);
    try {
      const response = await fetch("/api/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: revokeTarget.share.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "That link could not be revoked.");
      setLinks((current) =>
        current.map((item) =>
          item.share.id === revokeTarget.share.id
            ? { ...item, status: "revoked" }
            : item
        )
      );
      setRevokeTarget(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That link could not be revoked."
      );
    } finally {
      setRevoking(false);
    }
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
        >
          {error}
        </p>
      )}

      <ul className="space-y-2.5">
        {links.map((link) => {
          const active = link.status === "active";
          const fileGone = Boolean(link.file.deleted_at);
          return (
            <li
              key={link.share.id}
              className={cn(
                "rounded-3xl border bg-surface/90 p-4 shadow-sm transition",
                active ? "border-primary/30" : "border-line"
              )}
            >
              <div className="flex items-start gap-3">
                <FileTypeIcon extension={link.file.extension} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        STATUS_STYLE[link.status]
                      )}
                    >
                      {STATUS_LABEL[link.status]}
                    </span>
                    {link.share.hasPassword && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                        <Lock className="h-2.5 w-2.5" /> Password
                      </span>
                    )}
                    <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                      {link.share.allowDownload ? "Downloads on" : "View only"}
                    </span>
                    {fileGone && (
                      <span className="rounded-full bg-[#E892A2]/15 px-2 py-0.5 text-[10px] font-semibold text-[#a34b60] dark:text-[#f3b3c0]">
                        File in bin
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/files/${link.file.id}`}
                    className="mt-1 block truncate text-sm font-bold text-ink transition hover:text-primary-deep dark:hover:text-primary-soft"
                  >
                    {link.file.name}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {link.file.extension.toUpperCase()} ·{" "}
                    {formatBytes(link.file.size_bytes)} · created{" "}
                    {formatRelative(link.share.createdAt)}
                    {link.share.expiresAt
                      ? ` · ${
                          link.status === "expired" ? "expired" : "expires"
                        } ${formatDate(link.share.expiresAt)}`
                      : " · no expiry"}
                  </p>
                  {active && (
                    <p className="mt-1.5 flex items-center gap-1 truncate text-[10px] text-muted">
                      <Link2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{link.share.url}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line/60 pt-3">
                {active ? (
                  <>
                    <Button size="sm" onClick={() => copy(link)}>
                      {copiedId === link.share.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedId === link.share.id ? "Copied" : "Copy link"}
                    </Button>
                    <a
                      href={link.share.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-semibold text-ink shadow-sm ring-1 ring-line transition hover:bg-surface2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </a>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setError(null);
                        setRevokeTarget(link);
                      }}
                    >
                      <ShieldOff className="h-3.5 w-3.5" /> Revoke
                    </Button>
                  </>
                ) : (
                  <Link
                    href={`/files/${link.file.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-semibold text-ink shadow-sm ring-1 ring-line transition hover:bg-surface2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Create a new link
                  </Link>
                )}
                <Link
                  href={`/files/${link.file.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted transition hover:bg-surface2 hover:text-ink"
                >
                  View file
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Revoke this share link?"
        description={
          revokeTarget
            ? `“${revokeTarget.file.name}” will stop opening from this link immediately. The file stays in your library.`
            : undefined
        }
      >
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={revoke}
            loading={revoking}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4" /> Revoke link
          </Button>
          <Button
            variant="ghost"
            onClick={() => setRevokeTarget(null)}
            className="flex-1"
          >
            Keep it
          </Button>
        </div>
      </Modal>
    </>
  );
}
