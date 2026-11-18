import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_QUOTA_BYTES } from "@/lib/constants";
import { getFileCategory } from "@/lib/format";
import type {
  FileCategory,
  FileListItem,
  FileRecord,
  StorageSummary,
  TagRecord,
} from "@/types";

/**
 * Server-only helpers that decorate file rows with short-lived signed preview
 * URLs, tags and summary indicators before passing them to client components.
 * No storage path or bucket credential is ever sent to the browser.
 */

export async function getPreviewMap(
  supabase: SupabaseClient,
  userId: string,
  fileIds: string[]
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (!fileIds.length) return map;

  const { data } = await supabase
    .from("file_previews")
    .select("file_id, storage_path, page_number")
    .eq("user_id", userId)
    .in("file_id", fileIds)
    .order("page_number", { ascending: true });

  const rows = (data ?? []) as {
    file_id: string;
    storage_path: string;
    page_number: number;
  }[];
  if (!rows.length) return map;

  const { data: signed } = await supabase.storage
    .from("previews")
    .createSignedUrls(
      rows.map((row) => row.storage_path),
      3600
    );

  rows.forEach((row, index) => {
    const url = signed?.[index]?.signedUrl;
    if (url && !map[row.file_id]) map[row.file_id] = url;
  });
  return map;
}

export async function getTagsByFile(
  supabase: SupabaseClient,
  fileIds: string[]
): Promise<Record<string, TagRecord[]>> {
  const map: Record<string, TagRecord[]> = {};
  if (!fileIds.length) return map;

  const { data } = await supabase
    .from("file_tags")
    .select("file_id, tags(*)")
    .in("file_id", fileIds);

  const rows = (data ?? []) as {
    file_id: string;
    tags: TagRecord | TagRecord[] | null;
  }[];

  for (const row of rows) {
    const tags = Array.isArray(row.tags)
      ? row.tags
      : row.tags
        ? [row.tags]
        : [];
    if (!tags.length) continue;
    map[row.file_id] = [...(map[row.file_id] ?? []), ...tags];
  }
  return map;
}

export async function getSummarizedFileIds(
  supabase: SupabaseClient,
  userId: string,
  fileIds: string[]
): Promise<Set<string>> {
  if (!fileIds.length) return new Set();
  const { data } = await supabase
    .from("file_summaries")
    .select("file_id")
    .eq("user_id", userId)
    .eq("status", "ready")
    .in("file_id", fileIds);
  return new Set((data ?? []).map((row) => row.file_id as string));
}

export async function attachFileListItems(
  supabase: SupabaseClient,
  userId: string,
  files: FileRecord[]
): Promise<FileListItem[]> {
  if (!files.length) return [];
  const ids = files.map((file) => file.id);
  const [previewMap, tagsByFile, summarized] = await Promise.all([
    getPreviewMap(supabase, userId, ids),
    getTagsByFile(supabase, ids),
    getSummarizedFileIds(supabase, userId, ids),
  ]);

  return files.map((file) => ({
    ...file,
    previewUrl: previewMap[file.id] ?? null,
    tags: tagsByFile[file.id] ?? [],
    hasSummary: summarized.has(file.id),
  }));
}

export async function getStorageSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<StorageSummary> {
  const { data } = await supabase
    .from("files")
    .select("id, name, extension, size_bytes, is_favorite")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const rows = (data ?? []) as Pick<
    FileRecord,
    "id" | "name" | "extension" | "size_bytes" | "is_favorite"
  >[];

  const byCategory = {
    document: { count: 0, bytes: 0 },
    presentation: { count: 0, bytes: 0 },
    pdf: { count: 0, bytes: 0 },
    image: { count: 0, bytes: 0 },
    text: { count: 0, bytes: 0 },
    other: { count: 0, bytes: 0 },
  } satisfies Record<FileCategory, { count: number; bytes: number }>;

  let usedBytes = 0;
  for (const row of rows) {
    usedBytes += Number(row.size_bytes) || 0;
    const category = getFileCategory(row.extension);
    byCategory[category].count += 1;
    byCategory[category].bytes += Number(row.size_bytes) || 0;
  }

  const { count: folderCount } = await supabase
    .from("folders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    usedBytes,
    quotaBytes: STORAGE_QUOTA_BYTES,
    fileCount: rows.length,
    folderCount: folderCount ?? 0,
    byCategory,
    largestFiles: [...rows]
      .sort((a, b) => Number(b.size_bytes) - Number(a.size_bytes))
      .slice(0, 5)
      .map((row) => ({
        id: row.id,
        name: row.name,
        size_bytes: Number(row.size_bytes),
        extension: row.extension,
      })),
  };
}

export async function getFolderFileCounts(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("files")
    .select("folder_id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .not("folder_id", "is", null);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { folder_id: string | null }[]) {
    if (!row.folder_id) continue;
    counts[row.folder_id] = (counts[row.folder_id] ?? 0) + 1;
  }
  return counts;
}
