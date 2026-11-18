import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Avatar URLs are stored in profiles.avatar_url. Storage-backed avatars use a
 * "storage:<path>" marker so we never persist short-lived signed URLs; the
 * path is resolved to a signed URL on the server when a profile is loaded.
 * Plain http(s) URLs (for example a Google profile picture) still work.
 */
export const AVATAR_STORAGE_PREFIX = "storage:";
export const AVATAR_BUCKET = "avatars";

export function isStorageAvatar(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith(AVATAR_STORAGE_PREFIX);
}

export function avatarStoragePath(url: string): string {
  return url.slice(AVATAR_STORAGE_PREFIX.length);
}

export function buildStorageAvatar(path: string): string {
  return `${AVATAR_STORAGE_PREFIX}${path}`;
}

/** Turn a stored avatar value into something an <img> can render. */
export async function resolveAvatarUrl(
  supabase: SupabaseClient,
  avatarUrl: string | null | undefined
): Promise<string | null> {
  if (!avatarUrl) return null;
  if (!isStorageAvatar(avatarUrl)) return avatarUrl;

  try {
    const path = avatarStoragePath(avatarUrl);
    const { data } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
