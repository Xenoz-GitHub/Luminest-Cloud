"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import { FileTypeIcon } from "@/components/files/FileTypeIcon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatBytes, formatRelative, stripExtension } from "@/lib/format";
import type { FileListItem } from "@/types";

type Action = { type: "restore" | "delete"; file: FileListItem };

export function TrashList({ files }: { files: FileListItem[] }) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!action) return;
    setBusy(true);
    setError(null);
    try {
      const response =
        action.type === "restore"
          ? await fetch(`/api/files/${action.file.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ restore: true }),
            })
          : await fetch(`/api/files/${action.file.id}?permanent=true`, {
              method: "DELETE",
            });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "That action could not be completed.");
      }
      setAction(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That action could not be completed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ul className="space-y-2">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface/85 p-3 shadow-sm"
          >
            <FileTypeIcon extension={file.extension} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                {stripExtension(file.name)}
              </p>
              <p className="truncate text-[11px] text-muted">
                {file.extension.toUpperCase()} · {formatBytes(file.size_bytes)} ·
                deleted {file.deleted_at ? formatRelative(file.deleted_at) : "recently"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  setError(null);
                  setAction({ type: "restore", file });
                }}
                aria-label={`Restore ${file.name}`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Restore</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setAction({ type: "delete", file });
                }}
                aria-label={`Delete ${file.name} permanently`}
                className="text-[#a34b60] hover:bg-[#E892A2]/15 dark:text-[#f3b3c0]"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={
          action?.type === "restore" ? "Restore this file?" : "Delete permanently?"
        }
        description={
          action
            ? action.type === "restore"
              ? `“${action.file.name}” will return to your library.`
              : `“${action.file.name}” and its previews will be removed from storage. This cannot be undone.`
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
            variant={action?.type === "restore" ? "primary" : "danger"}
            loading={busy}
            onClick={run}
            className="flex-1"
          >
            {action?.type === "restore" ? (
              <>
                <RotateCcw className="h-4 w-4" /> Restore
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Delete forever
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setAction(null)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
