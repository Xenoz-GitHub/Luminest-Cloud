"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FileWarning,
  FolderOpen,
  HardDrive,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { FileTypeIcon } from "@/components/files/FileTypeIcon";
import { FileActions } from "@/components/files/FileActions";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  FileListItem,
  FilePreview,
  FileRecord,
  FileSummary,
  FolderRecord,
  ShareDto,
  TagRecord,
} from "@/types";

interface DetailsPayload {
  file: FileRecord;
  previews: { pageNumber: number; url: string; previewType: string }[];
  summary: FileSummary | null;
  tags: TagRecord[];
  folders: FolderRecord[];
  activeShare: ShareDto | null;
}

interface FilePreviewSheetProps {
  file: FileListItem | null;
  open: boolean;
  onClose: () => void;
}

export function FilePreviewSheet({ file, open, onClose }: FilePreviewSheetProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [details, setDetails] = useState<DetailsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const loadDetails = useCallback(
    async (signal?: AbortSignal) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/files/${file.id}/details`, {
          signal,
          cache: "no-store",
        });
        const payload = (await response.json()) as DetailsPayload & {
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || "The preview could not be loaded.");
        setDetails(payload);
        setPreviewIndex(0);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "The preview could not be loaded.");
      } finally {
        setLoading(false);
      }
    },
    [file]
  );

  useEffect(() => {
    if (!open || !file) return;
    const controller = new AbortController();
    void loadDetails(controller.signal);
    return () => controller.abort();
  }, [open, file, loadDetails]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const activeFile = details?.file ?? file;
  const previews = details?.previews ?? [];
  const currentPreview = previews[previewIndex] ?? previews[0];
  const summary = details?.summary;
  const content = summary?.key_points;
  const folderName = details?.folders.find(
    (folder) => folder.id === activeFile?.folder_id
  )?.name;

  if (!file) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close quick preview"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2b2138]/45 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Quick preview of ${activeFile?.name ?? file.name}`}
            initial={reduceMotion ? false : { y: "100%", opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0.9 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            drag={reduceMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 800) onClose();
            }}
            className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border-2 border-line bg-surface shadow-panel sm:rounded-[32px]"
          >
            <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-line sm:hidden" />
            <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-3">
              <div className="flex min-w-0 items-start gap-3">
                <FileTypeIcon extension={activeFile?.extension ?? file.extension} />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-extrabold text-ink">
                    {activeFile?.name ?? file.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {(activeFile?.extension ?? file.extension).toUpperCase()} ·{" "}
                    {formatBytes(activeFile?.size_bytes ?? file.size_bytes)}
                    {activeFile?.page_count ? ` · ${activeFile.page_count} pages` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface2 text-muted transition hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
              {loading && !details ? (
                <div className="space-y-3 py-3">
                  <div className="skeleton h-48 w-full rounded-3xl" />
                  <div className="skeleton h-4 w-2/3 rounded-full" />
                  <div className="skeleton h-4 w-1/2 rounded-full" />
                </div>
              ) : error ? (
                <div className="rounded-2xl bg-[#E892A2]/15 px-4 py-6 text-center">
                  <FileWarning className="mx-auto h-7 w-7 text-[#a34b60]" />
                  <p className="mt-2 text-sm font-semibold text-ink">
                    The quick preview didn’t load
                  </p>
                  <p className="mt-1 text-xs text-muted">{error}</p>
                  <button
                    type="button"
                    onClick={() => void loadDetails()}
                    className="mt-3 rounded-full bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-sm"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mt-1 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-primary/10 via-surface2 to-softBlue/30">
                    {currentPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentPreview.url}
                          alt={`Preview of ${activeFile?.name ?? file.name}, page ${currentPreview.pageNumber}`}
                          className="mx-auto max-h-[42dvh] w-full object-contain"
                        />
                        {previews.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewIndex((index) =>
                                  index === 0 ? previews.length - 1 : index - 1
                                )
                              }
                              aria-label="Previous preview page"
                              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur dark:bg-black/50 dark:text-white"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewIndex((index) =>
                                  index === previews.length - 1 ? 0 : index + 1
                                )
                              }
                              aria-label="Next preview page"
                              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur dark:bg-black/50 dark:text-white"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white">
                              Page {currentPreview.pageNumber} · {previewIndex + 1}/
                              {previews.length}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center px-6 py-10 text-center">
                        <FileTypeIcon
                          extension={activeFile?.extension ?? file.extension}
                          size="lg"
                        />
                        <p className="mt-3 text-sm font-semibold text-ink">
                          {activeFile?.preview_status === "unsupported"
                            ? "No preview for this type yet"
                            : activeFile?.preview_status === "failed"
                              ? "This preview needs another try"
                              : "Preview is still being prepared"}
                        </p>
                        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
                          {activeFile?.preview_status === "unsupported"
                            ? "The original file is safe and can be downloaded. Office slide conversion needs an external worker."
                            : activeFile?.preview_status === "failed"
                              ? "Open the file page to see the processing message and retry."
                              : "Lumi is working on it. You can open the file page for the latest status."}
                        </p>
                        <Link
                          href={`/files/${file.id}`}
                          className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-[#3d3153]"
                        >
                          Open file page
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1">
                      <Layers className="h-3 w-3" />
                      {activeFile?.preview_status === "ready"
                        ? `${previews.length} preview${previews.length === 1 ? "" : "s"}`
                        : activeFile?.preview_status ?? "pending"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1">
                      <HardDrive className="h-3 w-3" />
                      {formatBytes(activeFile?.size_bytes ?? file.size_bytes)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1">
                      <FolderOpen className="h-3 w-3" />
                      {folderName ?? "All files"}
                    </span>
                    <span className="rounded-full bg-surface2 px-2.5 py-1">
                      Uploaded {formatDate(activeFile?.created_at ?? file.created_at)}
                    </span>
                  </div>

                  {details?.tags && details.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {details.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: `${tag.color}33`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {summary?.summary && (
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-deep dark:text-primary-soft">
                        <Sparkles className="h-3.5 w-3.5" /> AI summary
                      </p>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink">
                        {content?.overview || summary.summary}
                      </p>
                      <Link
                        href={`/files/${file.id}`}
                        className="mt-2 inline-flex text-[11px] font-semibold text-primary-deep hover:underline dark:text-primary-soft"
                      >
                        Read the full summary
                      </Link>
                    </div>
                  )}

                  <div className="mt-4 border-t border-line pt-3">
                    <FileActions
                      file={activeFile ?? file}
                      folders={details?.folders ?? []}
                      initialShare={details?.activeShare ?? null}
                      layout="grid"
                      onChanged={() => void loadDetails()}
                      onDeleted={() => {
                        onClose();
                        router.refresh();
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
