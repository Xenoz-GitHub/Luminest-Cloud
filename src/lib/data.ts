import type { SupabaseClient } from "@supabase/supabase-js";
import type { FileRecord, FolderRecord, TagRecord } from "@/types";

/** Fetch folders for a user (ordered for pickers and breadcrumbs). */
export async function fetchFolders(
  supabase: SupabaseClient,
  userId: string
): Promise<FolderRecord[]> {
  const { data } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  return (data as FolderRecord[] | null) ?? [];
}

export async function fetchTags(
  supabase: SupabaseClient,
  userId: string
): Promise<TagRecord[]> {
  const { data } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  return (data as TagRecord[] | null) ?? [];
}

export async function fetchFileOwned(
  supabase: SupabaseClient,
  fileId: string,
  userId: string
): Promise<FileRecord | null> {
  const { data } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as FileRecord | null) ?? null;
}

/** Build ancestor breadcrumbs for a folder, defending against cycles. */
export function buildBreadcrumbs(
  folders: FolderRecord[],
  folderId: string | null
): FolderRecord[] {
  if (!folderId) return [];
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const chain: FolderRecord[] = [];
  const seen = new Set<string>();
  let current = byId.get(folderId) ?? null;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = current.parent_id ? (byId.get(current.parent_id) ?? null) : null;
  }
  return chain;
}

export function folderDescendantIds(
  folders: FolderRecord[],
  rootId: string
): string[] {
  const children = new Map<string | null, FolderRecord[]>();
  for (const folder of folders) {
    const list = children.get(folder.parent_id) ?? [];
    list.push(folder);
    children.set(folder.parent_id, list);
  }
  const result: string[] = [];
  const queue = [rootId];
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    for (const child of children.get(id) ?? []) queue.push(child.id);
  }
  return result;
}
