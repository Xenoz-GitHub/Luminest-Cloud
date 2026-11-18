"use client";

import { useState } from "react";
import { FileCard } from "@/components/files/FileCard";
import { FilePreviewSheet } from "@/components/files/FilePreviewSheet";
import { cn } from "@/lib/utils";
import type { FileListItem } from "@/types";

interface FileGridProps {
  files: FileListItem[];
  view?: "grid" | "list";
  className?: string;
}

export function FileGrid({ files, view = "grid", className }: FileGridProps) {
  const [preview, setPreview] = useState<FileListItem | null>(null);

  return (
    <>
      <div
        className={cn(
          view === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-2",
          className
        )}
      >
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            view={view}
            onPreview={(selected) => setPreview(selected)}
          />
        ))}
      </div>
      <FilePreviewSheet
        file={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
