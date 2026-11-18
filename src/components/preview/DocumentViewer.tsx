"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlignLeft,
  Check,
  Copy,
  Download,
  FileWarning,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { PdfViewer } from "@/components/preview/PdfViewer";
import { ImageViewer } from "@/components/preview/ImageViewer";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { processFileOnClient } from "@/lib/file-processing/process";
import { createClient } from "@/lib/supabase/client";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FileRecord } from "@/types";

interface DocumentViewerProps {
  file: FileRecord;
  previews: { pageNumber: number; url: string; previewType: string }[];
}

const MAX_PREVIEW_TEXT = 40_000;

function TextPreview({
  text,
  name,
  downloadHref,
}: {
  text: string;
  name: string;
  downloadHref: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const visibleText = text.slice(0, MAX_PREVIEW_TEXT);
  const truncated = text.length > MAX_PREVIEW_TEXT;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the text remains selectable.
    }
  }

  return (
    <div>
      <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-surface2/40 px-5 py-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary-deep dark:text-primary-soft">
          <AlignLeft className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-bold text-ink">
          Your text preview is ready
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
          {text.length.toLocaleString()} characters were extracted. Open the
          preview to read it in a calm, focused viewer.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => setOpen(true)} size="sm">
            <AlignLeft className="h-3.5 w-3.5" /> Click to see text preview
          </Button>
          <a
            href={downloadHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-semibold text-ink transition hover:bg-surface2"
          >
            <Download className="h-3.5 w-3.5" /> Download original
          </a>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Text preview"
        description={`${name} · ${text.length.toLocaleString()} characters`}
        className="max-w-2xl"
      >
        <div className="max-h-[60dvh] overflow-auto rounded-2xl border border-line bg-surface2/50 p-4">
          <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-ink">
            {visibleText}
            {truncated ? "\n\n…" : ""}
          </pre>
        </div>
        {truncated && (
          <p className="mt-2 text-[10px] text-muted">
            Showing the first {MAX_PREVIEW_TEXT.toLocaleString()} of{" "}
            {text.length.toLocaleString()} characters. Download the original for
            the full document.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="soft" size="sm" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy text"}
          </Button>
          <a
            href={downloadHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-semibold text-ink transition hover:bg-surface2"
          >
            <Download className="h-3.5 w-3.5" /> Download original
          </a>
        </div>
      </Modal>
    </div>
  );
}

export function DocumentViewer({ file, previews }: DocumentViewerProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const [retryError, setRetryError] = useState<string | null>(null);

  const downloadHref = `/api/files/${file.id}/download`;
  const extension = file.extension.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(extension);
  const isPdf = extension === "pdf";
  const isTextDocument = extension === "docx" || extension === "txt";
  const isPresentation = extension === "ppt" || extension === "pptx";
  const isLegacyDoc = extension === "doc";
  const processing =
    file.preview_status === "processing" ||
    file.preview_status === "queued" ||
    file.preview_status === "pending";
  const failed = file.preview_status === "failed";

  async function retry() {
    setRetrying(true);
    setRetryError(null);
    setRetryMessage("Fetching the original file…");
    try {
      const originalResponse = await fetch(`/api/files/${file.id}/original`, {
        cache: "no-store",
      });
      const originalPayload = (await originalResponse.json()) as {
        url?: string;
        error?: string;
      };
      if (!originalResponse.ok || !originalPayload.url) {
        throw new Error(originalPayload.error || "The original file could not be opened.");
      }

      const fileResponse = await fetch(originalPayload.url);
      if (!fileResponse.ok) throw new Error("The original file could not be read.");
      const blob = await fileResponse.blob();
      const source = new File([blob], file.name, {
        type: file.mime_type || blob.type,
      });

      setRetryMessage("Making a fresh preview…");
      const supabase = createClient();
      const processed = await processFileOnClient({
        file: source,
        record: {
          id: file.id,
          extension: file.extension,
          name: file.name,
        },
        userId: file.user_id,
        supabase,
        onProgress: (label) => setRetryMessage(label),
      });

      setRetryMessage("Saving the result…");
      const response = await fetch(`/api/files/${file.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processed),
      });
      const payload = (await response.json()) as { error?: string | null };
      if (!response.ok) {
        throw new Error(payload.error || "The file could not be processed again.");
      }
      setRetryMessage("Ready. Refreshing…");
      router.refresh();
    } catch (err) {
      setRetryError(
        err instanceof Error ? err.message : "The file could not be processed again."
      );
    } finally {
      setRetrying(false);
    }
  }

  if (isImage && previews[0]) {
    return <ImageViewer url={previews[0].url} title={file.name} />;
  }

  if (isPdf && previews.length) {
    return (
      <div>
        <PdfViewer previews={previews} title={file.name} />
        {file.page_count && previews.length < file.page_count && (
          <p className="mt-2 text-center text-[10px] text-muted">
            Showing the first {previews.length} of {file.page_count} pages. Preview
            generation is capped to keep uploads fast.
          </p>
        )}
      </div>
    );
  }

  if (isTextDocument && file.extracted_text) {
    return (
      <TextPreview
        text={file.extracted_text}
        name={file.name}
        downloadHref={downloadHref}
      />
    );
  }

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <Mascot state="processing" size={150} glow />
        <h3 className="mt-2 text-base font-bold text-ink">
          Lumi is still working on this
        </h3>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
          Previews can take a moment for large files. You can safely leave this
          page; processing continues when you upload.
        </p>
        <Button
          variant="soft"
          size="sm"
          className="mt-4"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Check again
        </Button>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <Mascot state="error" size={140} glow />
        <h3 className="mt-2 text-base font-bold text-ink">
          This preview didn’t make it
        </h3>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
          The original file is safe. Lumi can fetch it and try the preview again.
        </p>
        {retryError && (
          <p
            role="alert"
            className="mt-3 max-w-sm rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
          >
            {retryError}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={retry} loading={retrying} loadingLabel={retryMessage || "Retrying…"}>
            <RotateCcw className="h-4 w-4" /> Retry preview
          </Button>
          <a
            href={downloadHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-semibold text-ink transition hover:bg-surface2"
          >
            <Download className="h-3.5 w-3.5" /> Download original
          </a>
        </div>
      </div>
    );
  }

  if (isPresentation) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <Mascot expression="curious" size={140} glow />
        <span className="mt-2 rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8a6414]">
          Preview unavailable
        </span>
        <h3 className="mt-2 text-base font-bold text-ink">
          Slides need one more hop
        </h3>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
          PowerPoint previews require an external slide converter, which this
          deployment does not assume. Your presentation is stored safely and the
          original downloads perfectly.
        </p>
        <a
          href={downloadHref}
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          <Download className="h-4 w-4" /> Download presentation
        </a>
      </div>
    );
  }

  if (isLegacyDoc) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <Mascot expression="curious" size={140} glow />
        <span className="mt-2 rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8a6414]">
          Preview unavailable
        </span>
        <h3 className="mt-2 text-base font-bold text-ink">
          Legacy .doc, safely stored
        </h3>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
          Old Word files need an external converter for previews. Upload a DOCX
          version if you can — the original here will always stay downloadable.
        </p>
        <a
          href={downloadHref}
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          <Download className="h-4 w-4" /> Download document
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <Mascot state="generating-summary" size={140} glow />
      <FileWarning className="mt-1 h-6 w-6 text-primary-deep dark:text-primary-soft" />
      <h3 className="mt-2 text-base font-bold text-ink">
        No preview was saved for this file
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
        {isPdf || isImage || isTextDocument
          ? "Lumi can try again from the original file. Nothing has been lost."
          : "The original file is safe and available to download."}
      </p>
      {retryError && (
        <p
          role="alert"
          className="mt-3 max-w-sm rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
        >
          {retryError}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {(isPdf || isImage || isTextDocument) && (
          <Button
            onClick={retry}
            loading={retrying}
            loadingLabel={retryMessage || "Retrying…"}
          >
            <RotateCcw className="h-4 w-4" /> Retry processing
          </Button>
        )}
        <a
          href={downloadHref}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition",
            isPdf || isImage || isTextDocument
              ? "border border-line bg-surface text-ink hover:bg-surface2"
              : "bg-primary text-[#3d3153] hover:bg-primary-deep hover:text-white"
          )}
        >
          <Download className="h-4 w-4" /> Download original
        </a>
      </div>
      <p className="mt-3 text-[10px] text-muted">
        {file.extension.toUpperCase()} · {formatBytes(file.size_bytes)}
        {retrying && (
          <span className="ml-2 inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> {retryMessage}
          </span>
        )}
      </p>
    </div>
  );
}
