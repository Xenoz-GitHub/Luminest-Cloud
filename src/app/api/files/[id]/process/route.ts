import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson } from "@/lib/http";
import { verifyStoredFileSignature } from "@/lib/validation/file-signature";
import { MAX_TEXT_EXTRACT_BYTES } from "@/lib/constants";
import type { FileRecord, PreviewStatus } from "@/types";

export const runtime = "nodejs";

interface PreviewInput {
  pageNumber?: number;
  storagePath?: string;
  previewType?: string;
}

interface ProcessBody {
  previewStatus?: PreviewStatus;
  pageCount?: number | null;
  extractedText?: string;
  previews?: PreviewInput[];
  errorMessage?: string;
  /** Set when the browser uploaded the original to ImageKit. */
  imagekitFileId?: string | null;
  /** Path returned by ImageKit; used to prove ownership of the file id. */
  imagekitFilePath?: string | null;
}

const ALLOWED_STATUSES: PreviewStatus[] = [
  "ready",
  "failed",
  "unsupported",
  "processing",
];

async function finishJob(
  supabase: NonNullable<Awaited<ReturnType<typeof requireApiUser>>["supabase"]>,
  fileId: string,
  userId: string,
  status: "ready" | "failed",
  message: string | null
) {
  const { data: latest } = await supabase
    .from("processing_jobs")
    .select("id, attempts")
    .eq("file_id", fileId)
    .eq("user_id", userId)
    .eq("job_type", "preview")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest) {
    await supabase
      .from("processing_jobs")
      .update({
        status,
        error_message: message,
        attempts: (latest.attempts ?? 0) + 1,
      })
      .eq("id", latest.id)
      .eq("user_id", userId);
  } else {
    await supabase.from("processing_jobs").insert({
      file_id: fileId,
      user_id: userId,
      job_type: "preview",
      status,
      error_message: message,
      attempts: 1,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const { data: fileData } = await supabase
    .from("files")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const file = fileData as FileRecord | null;
  if (!file) return jsonError("That file doesn’t exist.", 404);

  // Extracted text is legitimately large (up to MAX_TEXT_EXTRACT_BYTES), so
  // this route uses a higher ceiling than the 64 KB API default.
  const body = await readJson<ProcessBody>(request, MAX_TEXT_EXTRACT_BYTES + 32_768);
  if (!body) return jsonError("The processing result was missing.");

  let status: PreviewStatus =
    body.previewStatus && ALLOWED_STATUSES.includes(body.previewStatus)
      ? body.previewStatus
      : "processing";

  // Office presentations are kept safe and downloadable; visual slide
  // conversion needs an external worker that this deployment doesn't assume.
  if (file.extension === "ppt" || file.extension === "pptx") {
    status = "unsupported";
  }

  let errorMessage = body.errorMessage?.slice(0, 500) ?? null;

  // ImageKit originals are not in Supabase storage, so skip the bucket
  // signature check for them (ImageKit already enforces the file type).
  const usesImageKit = file.storage_provider === "imagekit";

  if (!usesImageKit && (status === "ready" || status === "failed")) {
    const signature = await verifyStoredFileSignature(
      supabase,
      file.storage_path,
      file.extension
    );
    if (!signature.ok) {
      status = "failed";
      errorMessage =
        signature.reason ?? "The uploaded content did not match its file type.";
    }
  }

  const previews = Array.isArray(body.previews) ? body.previews : [];
  const validPreviews = previews
    .filter(
      (preview) =>
        typeof preview.storagePath === "string" &&
        preview.storagePath.startsWith(`${user.id}/${file.id}/`)
    )
    .slice(0, 12)
    .map((preview) => ({
      file_id: file.id,
      user_id: user.id,
      page_number: Math.max(0, Math.min(10_000, Number(preview.pageNumber ?? 1))),
      storage_path: preview.storagePath!,
      preview_type: preview.previewType?.slice(0, 40) || "image",
    }));

  if (status === "ready" || status === "unsupported") {
    await supabase
      .from("file_previews")
      .delete()
      .eq("file_id", file.id)
      .eq("user_id", user.id);
    if (validPreviews.length) {
      const { error: previewError } = await supabase
        .from("file_previews")
        .insert(validPreviews);
      if (previewError) {
        status = "failed";
        errorMessage = "Preview images could not be saved.";
      }
    }
  }

  const extractedText =
    typeof body.extractedText === "string"
      ? body.extractedText.slice(0, MAX_TEXT_EXTRACT_BYTES)
      : null;

  const pageCount =
    typeof body.pageCount === "number" && Number.isFinite(body.pageCount)
      ? Math.max(0, Math.floor(body.pageCount))
      : null;

  // Never trust a bare file id: deleting a file later uses it against the
  // ImageKit API with the service credentials. Only persist the id when the
  // accompanying path proves the object lives under this user's folder.
  const imagekitFilePath =
    typeof body.imagekitFilePath === "string" ? body.imagekitFilePath : "";
  const expectedImageKitPrefix = `/luminest/${user.id}/${file.id}/`;
  const imagekitFileId =
    usesImageKit &&
    typeof body.imagekitFileId === "string" &&
    body.imagekitFileId &&
    imagekitFilePath.startsWith(expectedImageKitPrefix) &&
    !imagekitFilePath.includes("..")
      ? body.imagekitFileId.slice(0, 200)
      : null;

  const { data: updated, error: updateError } = await supabase
    .from("files")
    .update({
      preview_status: status,
      page_count: pageCount,
      ...(extractedText ? { extracted_text: extractedText } : {}),
      ...(usesImageKit && imagekitFileId ? { imagekit_file_id: imagekitFileId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", file.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError) {
    return jsonError("The processing status could not be saved.", 500);
  }

  await finishJob(
    supabase,
    file.id,
    user.id,
    status === "failed" ? "failed" : "ready",
    errorMessage
  );

  if (status === "failed" && errorMessage) {
    return NextResponse.json(
      { file: updated, error: errorMessage },
      { status: 422 }
    );
  }

  return NextResponse.json({ file: updated, error: null });
}
