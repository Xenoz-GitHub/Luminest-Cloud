"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfViewerProps {
  previews: { pageNumber: number; url: string }[];
  title: string;
}

export function PdfViewer({ previews, title }: PdfViewerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [previews]);

  if (!previews.length) return null;
  const current = previews[Math.min(index, previews.length - 1)];
  const go = (next: number) => {
    setIndex((next + previews.length) % previews.length);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-primary/5 via-surface2 to-softBlue/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={`${title}, page ${current.pageNumber}`}
          className="mx-auto max-h-[62dvh] w-full object-contain"
        />
        {previews.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous page"
              className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white dark:bg-black/45 dark:text-white dark:hover:bg-black/65"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next page"
              className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white dark:bg-black/45 dark:text-white dark:hover:bg-black/65"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <span
          aria-live="polite"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold text-white"
        >
          Page {current.pageNumber} · {index + 1} of {previews.length}
        </span>
      </div>

      {previews.length > 1 && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {previews.map((preview, previewIndex) => (
            <button
              key={preview.pageNumber}
              type="button"
              onClick={() => setIndex(previewIndex)}
              aria-label={`Show page ${preview.pageNumber}`}
              aria-current={previewIndex === index ? "page" : undefined}
              className={cn(
                "relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2 bg-surface2 transition",
                previewIndex === index
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/55 px-1 text-[8px] font-bold text-white">
                {preview.pageNumber}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
