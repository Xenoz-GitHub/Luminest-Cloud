"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileUp,
  FolderOpen,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MIME_BY_EXTENSION } from "@/lib/constants";
import { formatBytes, getExtension } from "@/lib/format";
import { validateFileMetadata } from "@/lib/validation/file";
import { processFileOnClient } from "@/lib/file-processing/process";
import { uploadImageToImageKit } from "@/lib/imagekit-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { FileRecord, FolderRecord } from "@/types";

type Stage = "idle" | "uploading" | "processing" | "saving" | "success" | "error";

const ACCEPT =
  ".pdf,.doc,.docx,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif";

function putWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let detail = "";
        try {
          detail = (JSON.parse(xhr.responseText) as { message?: string }).message ?? "";
        } catch {
          detail = xhr.responseText.slice(0, 160);
        }
        reject(new Error(detail || `The upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () =>
      reject(new Error("The connection dropped during upload. Please try again."));
    xhr.onabort = () => reject(new Error("The upload was cancelled."));
    xhr.send(file);
  });
}

export function UploadFlow({ folders }: { folders: FolderRecord[] }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [folderId, setFolderId] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FileRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const busy = stage === "uploading" || stage === "processing" || stage === "saving";

  function chooseFile(selected: File | null) {
    if (!selected) return;
    const extension = getExtension(selected.name);
    const inferredMime =
      selected.type || MIME_BY_EXTENSION[extension]?.[0] || "";
    const validation = validateFileMetadata({
      name: selected.name,
      mimeType: inferredMime,
      size: selected.size,
    });
    if (!validation.ok) {
      setError(validation.error ?? "That file can’t be uploaded.");
      setStage("error");
      return;
    }
    setFile(selected);
    setError(null);
    setNotice(null);
    setResult(null);
    setStage("idle");
    setProgress(0);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const dropped = event.dataTransfer.files?.[0];
    chooseFile(dropped ?? null);
  }

  async function startUpload() {
    if (!file || busy) return;
    setStage("uploading");
    setError(null);
    setNotice(null);
    setProgress(2);
    setStatusLabel("Saying hello to your file…");

    let record: FileRecord | null = null;
    let uploadedToStorage = false;

    try {
      const extension = getExtension(file.name);
      const mimeType = file.type || MIME_BY_EXTENSION[extension]?.[0] || "";
      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          mimeType,
          size: file.size,
          folderId: folderId || null,
        }),
      });
      const payload = (await response.json()) as {
        file?: FileRecord;
        upload?: {
          provider?: "supabase" | "imagekit";
          signedUrl?: string;
          token?: string;
          path?: string;
          folder?: string;
          publicKey?: string;
          signature?: string;
          expire?: number;
        };
        error?: string;
      };
      if (!response.ok || !payload.file || !payload.upload) {
        throw new Error(payload.error || "A secure upload slot could not be created.");
      }
      record = payload.file;

      setStatusLabel("Sending your file into the nest…");

      let imagekitFileId: string | null = null;
      let imagekitFilePath: string | null = null;
      if (payload.upload.provider === "imagekit") {
        const uploaded = await uploadImageToImageKit({
          file,
          fileName: record.original_filename,
          credentials: {
            publicKey: payload.upload.publicKey!,
            signature: payload.upload.signature!,
            expire: payload.upload.expire!,
            token: payload.upload.token!,
            folder: payload.upload.folder!,
          },
          onProgress: (percent) => setProgress(4 + Math.round(percent * 0.54)),
        });
        imagekitFileId = uploaded.fileId;
        imagekitFilePath = uploaded.filePath;
      } else {
        await putWithProgress(payload.upload.signedUrl!, file, (percent) => {
          setProgress(4 + Math.round(percent * 0.54));
        });
      }
      uploadedToStorage = true;

      setStage("processing");
      setProgress(60);
      setStatusLabel("Making it easy to preview…");

      const supabase = createClient();
      const processed = await processFileOnClient({
        file,
        record: { id: record.id, extension: record.extension, name: record.name },
        userId: record.user_id,
        supabase,
        onProgress: (label, percent) => {
          setStatusLabel(label);
          setProgress(60 + Math.round(percent * 0.28));
        },
      });

      setStage("saving");
      setProgress(92);
      setStatusLabel("Tucking the details away…");

      const processResponse = await fetch(`/api/files/${record.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...processed, imagekitFileId, imagekitFilePath }),
      });
      const processPayload = (await processResponse.json()) as {
        file?: FileRecord;
        error?: string | null;
      };
      if (!processResponse.ok || !processPayload.file) {
        throw new Error(processPayload.error || "The file could not be finished.");
      }

      setResult(processPayload.file);
      setNotice(processed.errorMessage ?? null);
      setProgress(100);
      setStage("success");
      setStatusLabel("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong during upload.";
      if (record && !uploadedToStorage) {
        // The storage upload failed, so remove the empty file record.
        await fetch(`/api/files/${record.id}?permanent=true`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
      setError(message);
      setStage("error");
      setProgress(0);
    }
  }

  function reset() {
    setFile(null);
    setStage("idle");
    setProgress(0);
    setError(null);
    setNotice(null);
    setResult(null);
    setStatusLabel("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (stage === "success" && result) {
    return (
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col items-center px-6 py-10 text-center sm:py-12">
          <Mascot state="upload-success" size={190} glow priority />
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#7FC8A9]/15 px-3 py-1 text-xs font-bold text-[#2f7a5c] dark:text-[#a7e6cb]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Safely tucked away
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
            {result.name} is home!
          </h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            {formatBytes(result.size_bytes)} ·{" "}
            {result.page_count ? `${result.page_count} pages · ` : ""}
            {result.preview_status === "ready"
              ? "Previews are ready."
              : result.preview_status === "unsupported"
                ? "The original is stored; previews aren’t available for this type."
                : "Processing finished."}
          </p>
          {notice && (
            <p className="mt-3 max-w-md rounded-2xl bg-cream/70 px-4 py-3 text-xs font-medium text-[#8a6414] dark:bg-cream/10 dark:text-[#ffe0a3]">
              {notice}
            </p>
          )}
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <Link
              href={`/files/${result.id}`}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
            >
              Open the file <ArrowRight className="h-4 w-4" />
            </Link>
            <Button variant="secondary" onClick={reset} className="flex-1">
              <UploadCloud className="h-4 w-4" /> Upload another
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
              Add to your nest
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink">
              Bring a file to Lumi
            </h1>
            <p className="mt-1 text-sm text-muted">
              Drop it here or pick it from your device. Up to 50 MB.
            </p>
          </div>
          <Mascot
            state={busy ? "uploading" : "welcome"}
            size={104}
            animation={busy ? "float" : "wiggle"}
            className="shrink-0"
          />
        </div>

        <div
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label="Choose a file to upload"
          aria-disabled={busy || undefined}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (!busy && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-5 py-9 text-center transition",
            dragging
              ? "border-primary bg-primary/10"
              : "border-primary/30 bg-surface2/60 hover:border-primary/60 hover:bg-primary/5",
            busy && "pointer-events-none opacity-60"
          )}
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary-deep transition group-hover:scale-105 dark:text-primary-soft">
            <FileUp className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-ink">
            {file ? "Pick a different file" : "Tap to choose, or drop it here"}
          </p>
          <p className="mt-1 text-xs text-muted">
            PDF, DOCX, TXT, PPTX, PNG, JPG, WEBP, GIF
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
          />
        </div>

        {file && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-xs font-extrabold uppercase text-primary-deep dark:text-primary-soft">
              {getExtension(file.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
              <p className="text-xs text-muted">{formatBytes(file.size)}</p>
            </div>
            {!busy && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                aria-label="Remove selected file"
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {folders.length > 0 && (
          <label className="mt-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <FolderOpen className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
              Tuck it into a folder
            </span>
            <select
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
              disabled={busy}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            >
              <option value="">No folder (All files)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-2xl bg-[#E892A2]/15 px-4 py-3 text-sm font-medium text-[#a34b60] dark:text-[#f3b3c0]"
          >
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="text-current/70 hover:text-current"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Button
          onClick={startUpload}
          disabled={!file}
          loading={busy}
          loadingLabel={statusLabel || "Uploading…"}
          className="mt-5 w-full"
          size="lg"
        >
          <UploadCloud className="h-4 w-4" />
          Upload to my nest
        </Button>

        {/*
          The icon is inline rather than a flex child. As a flex item with
          items-center it sat vertically centred against the whole two-line
          block, which looked detached on phones where the note wraps.
        */}
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
          <Sparkles className="mr-1 inline-block h-3 w-3 -translate-y-px align-middle" />
          Files stay private. Previews and summaries are generated on demand.
        </p>
      </Card>

      {busy && (
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Mascot
              state={stage === "processing" || stage === "saving" ? "processing" : "uploading"}
              size={92}
              glow
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-bold text-ink">
                  {file?.name ?? "Your file"}
                </p>
                <p className="text-xs font-semibold text-primary-deep dark:text-primary-soft">
                  {Math.min(100, progress)}%
                </p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-primary/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-deep transition-[width] duration-500"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted" aria-live="polite">
                {statusLabel || "Working on it…"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {stage === "error" && (
        <Card className="border-danger/30 p-5">
          <div className="flex items-start gap-4">
            <Mascot expression="confused" size={92} />
            <div className="flex-1">
              <h2 className="text-base font-bold text-ink">That didn’t quite land</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{error}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={startUpload}>
                  <RotateCcw className="h-3.5 w-3.5" /> Try again
                </Button>
                <Button size="sm" variant="ghost" onClick={reset}>
                  Choose another file
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
