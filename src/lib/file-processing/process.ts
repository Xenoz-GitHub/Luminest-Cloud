"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_PDF_PREVIEW_PAGES,
  MAX_TEXT_EXTRACT_BYTES,
} from "@/lib/constants";
import type { FileRecord, PreviewStatus } from "@/types";

export interface ProcessingPreview {
  pageNumber: number;
  storagePath: string;
  previewType: string;
}

export interface ClientProcessingResult {
  previewStatus: PreviewStatus;
  pageCount: number | null;
  extractedText: string;
  previews: ProcessingPreview[];
  errorMessage?: string;
}

interface ProcessArgs {
  file: File;
  record: Pick<FileRecord, "id" | "extension" | "name">;
  userId: string;
  supabase: SupabaseClient;
  onProgress?: (label: string, percent: number) => void;
}

async function uploadPreview(
  supabase: SupabaseClient,
  storagePath: string,
  blob: Blob
): Promise<string> {
  const { error } = await supabase.storage.from("previews").upload(storagePath, blob, {
    contentType: blob.type || "image/webp",
    upsert: true,
  });
  if (error) {
    throw new Error(`A preview image could not be saved: ${error.message}`);
  }
  return storagePath;
}

async function processPdf(args: ProcessArgs): Promise<ClientProcessingResult> {
  const { file, record, userId, supabase, onProgress } = args;
  onProgress?.("Reading your PDF…", 10);

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = new Uint8Array(await file.arrayBuffer());
  const loading = pdfjs.getDocument({
    data: buffer,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const doc = await loading.promise;
  const pageCount = doc.numPages;

  let extractedText = "";
  const textPageLimit = Math.min(pageCount, 80);
  for (let pageNumber = 1; pageNumber <= textPageLimit; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) extractedText += `Page ${pageNumber}: ${pageText}\n\n`;
    page.cleanup();
    if (extractedText.length > MAX_TEXT_EXTRACT_BYTES) break;
    onProgress?.(
      `Reading page ${pageNumber} of ${textPageLimit}…`,
      10 + (pageNumber / textPageLimit) * 25
    );
  }
  if (pageCount > textPageLimit) {
    extractedText += `\n[Text extraction stopped after ${textPageLimit} of ${pageCount} pages.]\n`;
  }

  const previews: ProcessingPreview[] = [];
  const previewCount = Math.min(pageCount, MAX_PDF_PREVIEW_PAGES);
  for (let pageNumber = 1; pageNumber <= previewCount; pageNumber += 1) {
    onProgress?.(
      `Painting preview ${pageNumber} of ${previewCount}…`,
      38 + (pageNumber / previewCount) * 35
    );
    const page = await doc.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1100 / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not render the PDF preview.");
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82)
    );
    page.cleanup();
    if (blob) {
      const storagePath = `${userId}/${record.id}/page-${pageNumber}.webp`;
      await uploadPreview(supabase, storagePath, blob);
      previews.push({
        pageNumber,
        storagePath,
        previewType: "image/webp",
      });
    }
  }

  await doc.destroy();
  onProgress?.("Saving your preview…", 80);

  return {
    previewStatus: "ready",
    pageCount,
    extractedText: extractedText.slice(0, MAX_TEXT_EXTRACT_BYTES),
    previews,
  };
}

async function processImage(args: ProcessArgs): Promise<ClientProcessingResult> {
  const { file, record, userId, supabase, onProgress } = args;
  onProgress?.("Fluffing up your image…", 20);

  const bitmap = await createImageBitmap(file);
  const maxEdge = 1500;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the image.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  onProgress?.("Saving your preview…", 65);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86)
  );
  if (!blob) throw new Error("The image preview could not be created.");

  const storagePath = `${userId}/${record.id}/image-1.webp`;
  await uploadPreview(supabase, storagePath, blob);

  return {
    previewStatus: "ready",
    pageCount: 1,
    extractedText: "",
    previews: [{ pageNumber: 1, storagePath, previewType: "image/webp" }],
  };
}

async function processDocx(args: ProcessArgs): Promise<ClientProcessingResult> {
  const { file, onProgress } = args;
  onProgress?.("Reading your document…", 25);
  const mammoth = await import("mammoth/mammoth.browser");
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  const text = result.value.replace(/\n{3,}/g, "\n\n").trim();
  onProgress?.("Saving extracted text…", 80);
  return {
    previewStatus: "ready",
    pageCount: null,
    extractedText: text.slice(0, MAX_TEXT_EXTRACT_BYTES),
    previews: [],
  };
}

async function processText(args: ProcessArgs): Promise<ClientProcessingResult> {
  const { file, onProgress } = args;
  onProgress?.("Reading your text file…", 35);
  const text = await file.text();
  return {
    previewStatus: "ready",
    pageCount: null,
    extractedText: text.slice(0, MAX_TEXT_EXTRACT_BYTES),
    previews: [],
  };
}

export async function processFileOnClient(
  args: ProcessArgs
): Promise<ClientProcessingResult> {
  const extension = args.record.extension.toLowerCase();

  try {
    if (extension === "pdf") return await processPdf(args);
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
      return await processImage(args);
    }
    if (extension === "docx") return await processDocx(args);
    if (extension === "txt") return await processText(args);
    if (extension === "ppt" || extension === "pptx") {
      return {
        previewStatus: "unsupported",
        pageCount: null,
        extractedText: "",
        previews: [],
        errorMessage:
          "Slide previews need an external conversion worker. The original presentation is stored safely and can be downloaded.",
      };
    }
    if (extension === "doc") {
      return {
        previewStatus: "unsupported",
        pageCount: null,
        extractedText: "",
        previews: [],
        errorMessage:
          "Legacy .doc previews need an external converter. The original document is stored safely and can be downloaded.",
      };
    }

    return {
      previewStatus: "unsupported",
      pageCount: null,
      extractedText: "",
      previews: [],
      errorMessage: "This file type cannot be previewed yet.",
    };
  } catch (error) {
    return {
      previewStatus: "failed",
      pageCount: null,
      extractedText: "",
      previews: [],
      errorMessage:
        error instanceof Error
          ? error.message
          : "The file could not be processed.",
    };
  }
}
