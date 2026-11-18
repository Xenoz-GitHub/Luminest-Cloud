"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  FolderOpen,
  Heart,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Input, inputStyles } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ShareDialog } from "@/components/sharing/ShareDialog";
import { stripExtension } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FileRecord, FolderRecord, ShareDto } from "@/types";

interface FileActionsProps {
  file: FileRecord;
  folders: FolderRecord[];
  initialShare?: ShareDto | null;
  layout?: "grid" | "row";
  showOpen?: boolean;
  onChanged?: () => void;
  onDeleted?: () => void;
  className?: string;
}

function ActionItem({
  icon: Icon,
  label,
  href,
  onClick,
  tone = "default",
  layout,
  disabled,
}: {
  icon: typeof Download;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "danger";
  layout: "grid" | "row";
  disabled?: boolean;
}) {
  const content = (
    <>
      <span
        className={cn(
          "grid place-items-center rounded-full",
          layout === "grid"
            ? tone === "danger"
              ? "h-10 w-10 bg-[#E892A2]/15 text-[#a34b60] dark:text-[#f3b3c0]"
              : "h-10 w-10 bg-surface text-primary-deep shadow-sm dark:text-primary-soft"
            : ""
        )}
      >
        <Icon className={layout === "grid" ? "h-[18px] w-[18px]" : "h-4 w-4"} />
      </span>
      <span>{label}</span>
    </>
  );

  const base =
    layout === "grid"
      ? "flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold text-muted transition hover:bg-surface2 hover:text-ink disabled:opacity-50"
      : buttonStyles("soft", "sm");

  if (href) {
    return (
      <a href={href} className={base} download>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base} disabled={disabled}>
      {content}
    </button>
  );
}

export function FileActions({
  file,
  folders,
  initialShare = null,
  layout = "row",
  showOpen = true,
  onChanged,
  onDeleted,
  className,
}: FileActionsProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(file.is_favorite);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [share, setShare] = useState<ShareDto | null>(initialShare);
  const [shareOpen, setShareOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(stripExtension(file.name));
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveFolder, setMoveFolder] = useState(file.folder_id ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changed() {
    router.refresh();
    onChanged?.();
  }

  async function toggleFavorite() {
    if (favoriteBusy) return;
    const next = !favorite;
    setFavorite(next);
    setFavoriteBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!response.ok) throw new Error("The favorite could not be saved.");
      changed();
    } catch (err) {
      setFavorite(!next);
      setError(err instanceof Error ? err.message : "The favorite could not be saved.");
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function submitRename(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The file could not be renamed.");
      setRenameOpen(false);
      changed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The file could not be renamed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitMove(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: moveFolder || null }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The file could not be moved.");
      setMoveOpen(false);
      changed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The file could not be moved.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The file could not be deleted.");
      setDeleteOpen(false);
      onDeleted?.();
      router.refresh();
      if (!onDeleted) router.push("/files");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The file could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          layout === "grid" ? "grid grid-cols-4 gap-1.5" : "flex flex-wrap gap-2",
          className
        )}
      >
        {showOpen && (
          <Link href={`/files/${file.id}`} className={cn(layout === "grid" ? "contents" : "")}>
            <span
              className={cn(
                layout === "grid"
                  ? "flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold text-muted transition hover:bg-surface2 hover:text-ink"
                  : buttonStyles("primary", "sm")
              )}
            >
              <span
                className={cn(
                  layout === "grid" &&
                    "grid h-10 w-10 place-items-center rounded-full bg-primary text-[#3d3153] shadow-sm"
                )}
              >
                <Eye className={layout === "grid" ? "h-[18px] w-[18px]" : "h-4 w-4"} />
              </span>
              <span>Open</span>
            </span>
          </Link>
        )}
        <ActionItem
          icon={Download}
          label="Download"
          href={`/api/files/${file.id}/download`}
          layout={layout}
        />
        <ActionItem
          icon={Share2}
          label="Share"
          onClick={() => setShareOpen(true)}
          layout={layout}
        />
        <ActionItem
          icon={Heart}
          label={favorite ? "Favorited" : "Favorite"}
          onClick={toggleFavorite}
          layout={layout}
          disabled={favoriteBusy}
        />
        <ActionItem
          icon={FolderOpen}
          label="Move"
          onClick={() => {
            setMoveFolder(file.folder_id ?? "");
            setError(null);
            setMoveOpen(true);
          }}
          layout={layout}
        />
        <ActionItem
          icon={Pencil}
          label="Rename"
          onClick={() => {
            setRenameValue(stripExtension(file.name));
            setError(null);
            setRenameOpen(true);
          }}
          layout={layout}
        />
        <ActionItem
          icon={Trash2}
          label="Delete"
          tone="danger"
          onClick={() => {
            setError(null);
            setDeleteOpen(true);
          }}
          layout={layout}
        />
      </div>

      {error && layout === "row" && (
        <p role="alert" className="mt-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]">
          {error}
        </p>
      )}

      <ShareDialog
        fileId={file.id}
        fileName={file.name}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        initialShare={share}
        onShareChanged={(next) => {
          setShare(next);
          changed();
        }}
      />

      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename this file"
        description="The extension stays the same so previews keep working."
      >
        <form onSubmit={submitRename} className="space-y-4">
          <Input
            label="File name"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            autoFocus
            maxLength={160}
            hint={`The .${file.extension} extension is added automatically.`}
          />
          {error && (
            <p role="alert" className="text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" loading={busy} className="flex-1">
              Save name
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        title="Move to a folder"
        description="Choose where this file should live. You can move it again anytime."
      >
        <form onSubmit={submitMove} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Folder</span>
            <select
              value={moveFolder}
              onChange={(event) => setMoveFolder(event.target.value)}
              className={inputStyles}
            >
              <option value="">No folder (All files)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" loading={busy} className="flex-1">
              Move file
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Move to the bin?"
        description={`“${file.name}” will leave your library. You can restore it later from the bin.`}
      >
        {error && (
          <p role="alert" className="mb-3 rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="danger" onClick={confirmDelete} loading={busy} className="flex-1">
            Move to bin
          </Button>
          <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="flex-1">
            Keep it
          </Button>
        </div>
      </Modal>
    </>
  );
}
