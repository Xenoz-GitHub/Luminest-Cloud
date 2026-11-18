"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { inputStyles } from "@/components/ui/Input";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ShareDto } from "@/types";

interface ShareDialogProps {
  fileId: string;
  fileName: string;
  open: boolean;
  onClose: () => void;
  initialShare?: ShareDto | null;
  onShareChanged?: (share: ShareDto | null) => void;
}

const EXPIRY_OPTIONS = [
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "never", label: "Never expires" },
] as const;

type Expiry = (typeof EXPIRY_OPTIONS)[number]["value"];

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

export function ShareDialog({
  fileId,
  fileName,
  open,
  onClose,
  initialShare = null,
  onShareChanged,
}: ShareDialogProps) {
  const [share, setShare] = useState<ShareDto | null>(initialShare);
  const [expiry, setExpiry] = useState<Expiry>("7d");
  const [allowDownload, setAllowDownload] = useState(true);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setShare(initialShare);
    setError(null);
    setNotice(null);
    setCopied(false);
    setUsePassword(Boolean(initialShare?.hasPassword));
    setAllowDownload(initialShare?.allowDownload ?? true);
    setPassword("");
  }, [open, initialShare]);

  async function createLink() {
    setError(null);
    setNotice(null);
    if (usePassword && password.trim().length > 0 && password.trim().length < 4) {
      setError("Use at least 4 characters for the link password.");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          expiresIn: expiry,
          allowDownload,
          password: usePassword && password.trim() ? password.trim() : null,
        }),
      });
      const payload = (await response.json()) as {
        share?: ShareDto;
        error?: string;
      };
      if (!response.ok || !payload.share) {
        throw new Error(payload.error || "The share link could not be created.");
      }
      setShare(payload.share);
      onShareChanged?.(payload.share);
      setNotice("Link ready. Anyone with it can open the share page.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The link could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeLink() {
    if (!share) return;
    setError(null);
    setNotice(null);
    setRevoking(true);
    try {
      const response = await fetch("/api/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: share.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The link could not be revoked.");
      setShare(null);
      onShareChanged?.(null);
      setNotice("Link revoked. It no longer opens the file.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The link could not be revoked.");
    } finally {
      setRevoking(false);
    }
  }

  async function copyLink() {
    if (!share) return;
    const ok = await copyText(share.url);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
    else setError("Copying was blocked. Select the link and copy it manually.");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share a little link"
      description={`Create a branded LumiNest page for ${fileName}. No account needed to open it.`}
    >
      {share ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-deep dark:text-primary-soft">
              Your share page
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={share.url}
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Share link"
                className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink"
              />
              <Button size="sm" onClick={copyLink} aria-label="Copy share link">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <a
              href={share.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-deep hover:underline dark:text-primary-soft"
            >
              Open the page <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-semibold text-muted">
              <Link2 className="h-3 w-3" />
              {share.expiresAt ? `Expires ${formatDate(share.expiresAt)}` : "No expiry"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-semibold text-muted">
              <ShieldCheck className="h-3 w-3" />
              {share.allowDownload ? "Downloads allowed" : "View only"}
            </span>
            {share.hasPassword && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-semibold text-muted">
                <Lock className="h-3 w-3" /> Password protected
              </span>
            )}
          </div>

          {notice && (
            <p role="status" className="rounded-2xl bg-[#7FC8A9]/15 px-3 py-2 text-xs font-medium text-[#2f7a5c] dark:text-[#a7e6cb]">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="danger" onClick={revokeLink} loading={revoking} className="flex-1">
              Revoke link
            </Button>
            <Button
              variant="soft"
              onClick={() => {
                setShare(null);
                setNotice(null);
                setError(null);
              }}
              className="flex-1"
            >
              New link settings
            </Button>
          </div>
          <p className="text-center text-[10px] leading-relaxed text-muted">
            Creating another link for this file automatically revokes the current
            one. Revoked and expired links stop working immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              Link expires
            </span>
            <select
              value={expiry}
              onChange={(event) => setExpiry(event.target.value as Expiry)}
              className={inputStyles}
            >
              {EXPIRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface2/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Allow downloads</p>
              <p className="text-[11px] text-muted">
                Recipients can always preview; this controls the download button.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowDownload}
              onClick={() => setAllowDownload((value) => !value)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                allowDownload ? "bg-primary" : "bg-line"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                  allowDownload ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-surface2/60 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-1 text-sm font-semibold text-ink">
                  <Lock className="h-3.5 w-3.5" /> Password protection
                </p>
                <p className="text-[11px] text-muted">
                  Ask for a password before the page opens.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={usePassword}
                onClick={() => setUsePassword((value) => !value)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition",
                  usePassword ? "bg-primary" : "bg-line"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                    usePassword ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            </div>
            {usePassword && (
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 4 characters"
                autoComplete="new-password"
                className={cn(inputStyles, "mt-3 py-2.5 text-xs")}
              />
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-2xl bg-[#7FC8A9]/15 px-3 py-2 text-xs font-medium text-[#2f7a5c] dark:text-[#a7e6cb]">
              {notice}
            </p>
          )}

          <Button onClick={createLink} loading={creating} loadingLabel="Creating link…" className="w-full">
            <Link2 className="h-4 w-4" /> Create share link
          </Button>
          <p className="text-center text-[10px] leading-relaxed text-muted">
            The link uses a secure, unguessable token. The public page never
            exposes your storage bucket or account.
          </p>
        </div>
      )}
    </Modal>
  );
}
