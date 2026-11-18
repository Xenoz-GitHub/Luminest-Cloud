import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireApiUser, jsonError, readJson, requestIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { validateFileMetadata } from "@/lib/validation/file";
import { STORAGE_QUOTA_BYTES } from "@/lib/constants";
import { createUploadCredentials, isImageKitConfigured } from "@/lib/imagekit";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"];

export const runtime = "nodejs";

interface UploadBody {
  name?: string;
  mimeType?: string;
  size?: number;
  folderId?: string | null;
}

export async function POST(request: Request) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const limit = rateLimit(`upload:${user.id}:${requestIp(request)}`, 30, 60_000);
  if (!limit.ok) {
    return jsonError("Too many uploads. Give it a moment and try again.", 429);
  }

  const body = await readJson<UploadBody>(request);
  if (!body) return jsonError("The upload details were missing.");

  const validation = validateFileMetadata({
    name: body.name ?? "",
    mimeType: body.mimeType ?? "",
    size: Number(body.size ?? 0),
  });
  if (!validation.ok || !validation.extension || !validation.safeName) {
    return jsonError(validation.error ?? "That file can’t be uploaded.", 400);
  }

  // Enforce the storage quota on the server. Soft-deleted files still count
  // toward usage (they are only freed on permanent delete), matching the UI.
  const { data: usageRows } = await supabase
    .from("files")
    .select("size_bytes")
    .eq("user_id", user.id);
  const usedBytes = (usageRows ?? []).reduce(
    (sum, row) => sum + (Number((row as { size_bytes: number }).size_bytes) || 0),
    0
  );
  if (usedBytes + Number(body.size) > STORAGE_QUOTA_BYTES) {
    return jsonError(
      "Your nest is full. Free up some space by permanently deleting files before uploading more.",
      413
    );
  }

  let folderId: string | null = body.folderId || null;
  if (folderId) {
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!folder) return jsonError("That folder doesn’t exist.", 404);
  } else {
    folderId = null;
  }

  const fileId = randomUUID();

  // Plain images go to ImageKit; documents stay in private Supabase storage.
  const useImageKit =
    IMAGE_EXTENSIONS.includes(validation.extension) && isImageKitConfigured();
  const storageProvider: "supabase" | "imagekit" = useImageKit
    ? "imagekit"
    : "supabase";
  const storagePath = useImageKit
    ? `/luminest/${user.id}/${fileId}/${validation.safeName}`
    : `${user.id}/${fileId}/${validation.safeName}`;

  const { data: file, error: insertError } = await supabase
    .from("files")
    .insert({
      id: fileId,
      user_id: user.id,
      folder_id: folderId,
      name: validation.safeName,
      original_filename: validation.safeName,
      mime_type: body.mimeType,
      extension: validation.extension,
      size_bytes: Number(body.size),
      storage_path: storagePath,
      storage_provider: storageProvider,
      preview_status: "queued",
      summary_status: "none",
    })
    .select("*")
    .single();

  if (insertError || !file) {
    // Log the DB detail server-side; it often reveals a missing migration,
    // RLS denial, or schema-cache issue without exposing it to the client.
    console.error("[upload] files insert failed:", insertError?.code, insertError?.message, insertError?.details);
    return jsonError(
      "The file record could not be created. If this is a fresh project, make sure the Supabase schema has been applied.",
      500
    );
  }

  await supabase.from("processing_jobs").insert({
    file_id: fileId,
    user_id: user.id,
    job_type: "preview",
    status: "queued",
    attempts: 0,
  });

  if (useImageKit) {
    // The browser uploads directly to ImageKit with short-lived credentials.
    const credentials = createUploadCredentials(user.id);
    return NextResponse.json({
      file,
      upload: {
        provider: "imagekit",
        path: storagePath,
        folder: `/luminest/${user.id}/${fileId}`,
        ...credentials,
      },
    });
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("files")
    .createSignedUploadUrl(storagePath);

  if (signedError || !signed) {
    await supabase.from("files").delete().eq("id", fileId).eq("user_id", user.id);
    return jsonError("A secure upload slot could not be created.", 500);
  }

  return NextResponse.json({
    file,
    upload: {
      provider: "supabase",
      signedUrl: signed.signedUrl,
      token: signed.token,
      path: storagePath,
    },
  });
}
