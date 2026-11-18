"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Plus, Tag, X } from "lucide-react";
import { inputStyles } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { TagRecord } from "@/types";

interface TagEditorProps {
  fileId: string;
  initialTags: TagRecord[];
  allTags: TagRecord[];
}

export function TagEditor({ fileId, initialTags, allTags }: TagEditorProps) {
  const [selected, setSelected] = useState<TagRecord[]>(initialTags);
  const [available, setAvailable] = useState<TagRecord[]>(allTags);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const selectedIds = useMemo(
    () => new Set(selected.map((tag) => tag.id)),
    [selected]
  );
  const unselected = available.filter((tag) => !selectedIds.has(tag.id));

  async function attach(tag: TagRecord) {
    setBusyId(tag.id);
    setError(null);
    const previous = selected;
    setSelected([...selected, tag]);
    try {
      const response = await fetch(`/api/files/${fileId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id, action: "add" }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "That tag could not be added.");
      setAdding(false);
    } catch (err) {
      setSelected(previous);
      setError(err instanceof Error ? err.message : "That tag could not be added.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(tag: TagRecord) {
    setBusyId(tag.id);
    setError(null);
    const previous = selected;
    setSelected(selected.filter((item) => item.id !== tag.id));
    try {
      const response = await fetch(`/api/files/${fileId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id, action: "remove" }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "That tag could not be removed.");
    } catch (err) {
      setSelected(previous);
      setError(err instanceof Error ? err.message : "That tag could not be removed.");
    } finally {
      setBusyId(null);
    }
  }

  async function createTag(event: React.FormEvent) {
    event.preventDefault();
    const name = newTag.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as {
        tag?: TagRecord;
        error?: string;
      };
      if (!response.ok || !payload.tag) {
        throw new Error(payload.error || "That tag could not be created.");
      }
      const tag = payload.tag;
      setAvailable((current) =>
        current.some((item) => item.id === tag.id)
          ? current
          : [...current, tag].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewTag("");
      if (!selectedIds.has(tag.id)) await attach(tag);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That tag could not be created."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-deep dark:text-primary-soft">
        <Tag className="h-3.5 w-3.5" /> Tags
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map((tag) => (
          <span
            key={tag.id}
            className="group inline-flex items-center gap-1 rounded-full bg-primary/15 py-1 pl-2.5 pr-1 text-[11px] font-semibold text-ink"
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
            <button
              type="button"
              onClick={() => remove(tag)}
              disabled={busyId === tag.id}
              aria-label={`Remove tag ${tag.name}`}
              className="grid h-5 w-5 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
            >
              {busyId === tag.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-muted">No tags yet.</span>
        )}
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          aria-expanded={adding}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-[11px] font-semibold transition",
            adding
              ? "border-primary bg-primary/10 text-primary-deep dark:text-primary-soft"
              : "border-line text-muted hover:border-primary/50 hover:text-ink"
          )}
        >
          <Plus className="h-3 w-3" /> Add tag
        </button>
      </div>

      {adding && (
        <div className="mt-3 space-y-2 rounded-2xl border border-line bg-surface2/50 p-3">
          {unselected.length > 0 && (
            <select
              value=""
              aria-label="Add an existing tag"
              onChange={(event) => {
                const tag = available.find(
                  (item) => item.id === event.target.value
                );
                if (tag) attach(tag);
              }}
              className={cn(inputStyles, "py-2 text-xs")}
            >
              <option value="">Choose an existing tag…</option>
              {unselected.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          )}
          <form onSubmit={createTag} className="flex gap-2">
            <input
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              placeholder="Or make a new tag"
              maxLength={40}
              aria-label="New tag name"
              className={cn(inputStyles, "py-2 text-xs")}
            />
            <button
              type="submit"
              disabled={creating || !newTag.trim()}
              aria-label="Create and add tag"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-[#3d3153] transition hover:bg-primary-deep hover:text-white disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </button>
          </form>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-2 rounded-xl bg-[#E892A2]/15 px-2.5 py-1.5 text-[11px] font-medium text-[#a34b60] dark:text-[#f3b3c0]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
