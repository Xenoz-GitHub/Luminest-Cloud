"use client";

import Link from "next/link";
import { Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FolderRecord } from "@/types";

interface FolderCardProps {
  folder: FolderRecord;
  fileCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function FolderCard({
  folder,
  fileCount = 0,
  onEdit,
  onDelete,
  className,
}: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const color = folder.color || "#B9A5EA";

  return (
    <div
      className={cn(
        "group relative rounded-[28px] border-2 border-line bg-surface/90 p-3.5 shadow-toony-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-toony",
        className
      )}
    >
      <Link
        href={`/files?folder=${folder.id}`}
        className="flex flex-col gap-2.5 focus-visible:outline-none"
      >
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{ backgroundColor: `${color}33`, color }}
        >
          <Folder className="h-5 w-5 fill-current/20" />
        </span>
        <span className="min-w-0">
          <span className="block truncate pr-6 text-sm font-bold text-ink">
            {folder.name}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </span>
        </span>
      </Link>

      {(onEdit || onDelete) && (
        <div className="absolute right-1.5 top-1.5">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={`Folder actions for ${folder.name}`}
            aria-expanded={menuOpen}
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close folder actions"
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-2xl border-2 border-line bg-surface p-1 shadow-float">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink transition hover:bg-surface2"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename folder
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#a34b60] transition hover:bg-[#E892A2]/15 dark:text-[#f3b3c0]"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete folder
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
