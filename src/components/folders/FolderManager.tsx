"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Trash2 } from "lucide-react";
import { FolderCard } from "@/components/folders/FolderCard";
import { FolderDialog } from "@/components/folders/FolderDialog";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { FolderRecord } from "@/types";

interface FolderManagerProps {
  folders: FolderRecord[];
  counts?: Record<string, number>;
  parentId?: string | null;
  title?: string;
  description?: string;
  showCreate?: boolean;
  className?: string;
  onChanged?: () => void;
}

export function FolderManager({
  folders,
  counts = {},
  parentId = null,
  title = "Folders",
  description,
  showCreate = true,
  className,
  onChanged,
}: FolderManagerProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FolderRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
    onChanged?.();
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(folder: FolderRecord) {
    setEditing(folder);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/folders/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "That folder could not be deleted.");
      }
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That folder could not be deleted."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!folders.length && !showCreate) return null;

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold tracking-tight text-ink sm:text-lg">
            {title}
          </h2>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {showCreate && (
          <Button size="sm" variant="soft" onClick={openCreate}>
            <FolderPlus className="h-3.5 w-3.5" /> New folder
          </Button>
        )}
      </div>

      {folders.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              fileCount={counts[folder.id] ?? 0}
              onEdit={() => openEdit(folder)}
              onDelete={() => {
                setError(null);
                setDeleteTarget(folder);
              }}
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={openCreate}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/30 bg-surface/60 px-4 py-5 text-xs font-semibold text-muted transition hover:border-primary/60 hover:bg-primary/5 hover:text-ink"
        >
          <FolderPlus className="h-4 w-4" />
          Create your first folder
        </button>
      )}

      <FolderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        folder={editing}
        parentId={parentId}
        onSaved={refresh}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this folder?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed. Files inside stay safe and move back to All files; nested folders are deleted too.`
            : undefined
        }
      >
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
          >
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="danger"
            loading={deleting}
            onClick={confirmDelete}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4" /> Delete folder
          </Button>
          <Button
            variant="ghost"
            onClick={() => setDeleteTarget(null)}
            className="flex-1"
          >
            Keep it
          </Button>
        </div>
      </Modal>
    </section>
  );
}
