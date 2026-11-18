"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Heart,
  Loader2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useLongPress } from "@/components/files/useLongPress";
import { FileTypeIcon } from "@/components/files/FileTypeIcon";
import { formatBytes, formatRelative, stripExtension } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FileListItem } from "@/types";

interface FileCardProps {
  file: FileListItem;
  view: "grid" | "list";
  onPreview: (file: FileListItem) => void;
}

export function FileCard({ file, view, onPreview }: FileCardProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(file.is_favorite);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const { pressing, wasLongPress, handlers } = useLongPress({
    onLongPress: () => onPreview(file),
  });

  async function toggleFavorite(event: React.MouseEvent) {
    event.stopPropagation();
    if (favoriteBusy) return;
    const next = !favorite;
    setFavorite(next);
    setFavoriteBusy(true);
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setFavorite(!next);
    } finally {
      setFavoriteBusy(false);
    }
  }

  function openDetail() {
    if (wasLongPress()) return;
    router.push(`/files/${file.id}`);
  }

  const processing =
    file.preview_status === "processing" ||
    file.preview_status === "queued" ||
    file.preview_status === "pending";
  const failed = file.preview_status === "failed";
  const unsupported = file.preview_status === "unsupported";

  const statusBadge = processing ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3C677]/25 px-2 py-0.5 text-[10px] font-bold text-[#8a6414] dark:text-[#ffe0a3]">
      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Processing
    </span>
  ) : failed ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#E892A2]/20 px-2 py-0.5 text-[10px] font-bold text-[#a34b60] dark:text-[#f3b3c0]">
      <TriangleAlert className="h-2.5 w-2.5" /> Needs retry
    </span>
  ) : unsupported ? (
    <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-bold text-muted">
      No preview
    </span>
  ) : null;

  const previewImage =
    file.previewUrl && ["pdf", "png", "jpg", "jpeg", "webp", "gif"].includes(file.extension)
      ? file.previewUrl
      : null;

  const cardCommon =
    "group relative cursor-pointer select-none rounded-[28px] border-2 border-line bg-surface/90 shadow-toony-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-toony focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${file.name}, ${file.extension.toUpperCase()}, ${formatBytes(file.size_bytes)}. Long press or open actions for a quick preview.`}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
        if (event.key === "F10" && event.shiftKey) {
          event.preventDefault();
          onPreview(file);
        }
      }}
      {...handlers}
      className={cn(
        cardCommon,
        pressing && "scale-[1.025] shadow-toony-lg ring-2 ring-primary/40",
        view === "grid" ? "overflow-hidden" : "flex items-center gap-3 p-3"
      )}
    >
      {view === "grid" ? (
        <>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/10 via-surface2 to-softBlue/40">
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <FileTypeIcon extension={file.extension} size="lg" />
              </div>
            )}
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
              {statusBadge}
              {file.hasSummary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  <Sparkles className="h-2.5 w-2.5" /> AI
                </span>
              )}
            </div>
            <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPreview(file);
                }}
                aria-label={`Quick preview ${file.name}`}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white dark:bg-black/40 dark:text-white"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={favorite}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white dark:bg-black/40 dark:text-white"
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5",
                    favorite && "fill-[#E892A2] text-[#E892A2]"
                  )}
                />
              </button>
            </div>
          </div>
          <div className="p-3.5">
            <p className="truncate text-sm font-bold text-ink" title={file.name}>
              {stripExtension(file.name)}
            </p>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted">
              <span className="truncate">
                {file.extension.toUpperCase()} · {formatBytes(file.size_bytes)}
              </span>
              <span className="shrink-0">{formatRelative(file.created_at)}</span>
            </div>
            {file.tags && file.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {file.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    style={{ backgroundColor: `${tag.color}33`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-softBlue/30">
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <FileTypeIcon extension={file.extension} size="sm" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-ink">
                {stripExtension(file.name)}
              </p>
              {statusBadge}
              {file.hasSummary && (
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-deep dark:text-primary-soft" />
              )}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {file.extension.toUpperCase()} · {formatBytes(file.size_bytes)} ·{" "}
              {formatRelative(file.created_at)}
              {file.page_count ? ` · ${file.page_count} pages` : ""}
            </p>
            {file.tags && file.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {file.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    style={{ backgroundColor: `${tag.color}33`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorite}
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  favorite && "fill-[#E892A2] text-[#E892A2]"
                )}
              />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPreview(file);
              }}
              aria-label={`Quick preview ${file.name}`}
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
