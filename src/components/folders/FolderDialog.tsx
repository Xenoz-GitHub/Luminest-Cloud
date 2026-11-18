"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FOLDER_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { FolderRecord } from "@/types";

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  folder?: FolderRecord | null;
  parentId?: string | null;
  onSaved?: (folder: FolderRecord) => void;
}

export function FolderDialog({
  open,
  onClose,
  folder = null,
  parentId = null,
  onSaved,
}: FolderDialogProps) {
  const editing = Boolean(folder);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(FOLDER_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(folder?.name ?? "");
    setColor(folder?.color ?? FOLDER_COLORS[0]);
    setError(null);
    setBusy(false);
  }, [open, folder]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError("Give your folder a short name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        editing ? `/api/folders/${folder!.id}` : "/api/folders",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editing ? { name: clean, color } : { name: clean, color, parentId }
          ),
        }
      );
      const payload = (await response.json()) as {
        folder?: FolderRecord;
        error?: string;
      };
      if (!response.ok || !payload.folder) {
        throw new Error(payload.error || "That folder could not be saved.");
      }
      onSaved?.(payload.folder);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That folder could not be saved."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Rename this folder" : "Create a new folder"}
      description={
        editing
          ? "A new name and colour, without moving anything inside."
          : "Folders keep like things together. You can nest them later."
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Folder name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Biology notes"
          maxLength={80}
          autoFocus
          error={error ?? undefined}
        />

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Folder colour</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Folder colour">
            {FOLDER_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={color === option}
                aria-label={`Use colour ${option}`}
                onClick={() => setColor(option)}
                className={cn(
                  "h-10 w-10 rounded-2xl transition",
                  color === option
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                    : "hover:scale-105"
                )}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={busy} className="flex-1">
            {editing ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <FolderPlus className="h-4 w-4" />
            )}
            {editing ? "Save folder" : "Create folder"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
