import { NextResponse } from "next/server";
import { requireApiUser, jsonError, readJson } from "@/lib/http";
import {
  AVATAR_BUCKET,
  avatarStoragePath,
  buildStorageAvatar,
  isStorageAvatar,
} from "@/lib/avatar";
import type { ProfilePreferences } from "@/types";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const { error, supabase, user } = await requireApiUser();
  if (error || !supabase || !user) return error;

  const body = await readJson<{
    username?: string;
    avatarUrl?: string | null;
    avatarPath?: string | null;
    preferences?: ProfilePreferences;
  }>(request);
  if (!body) return jsonError("No changes were provided.");

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, avatar_url, preferences")
    .eq("id", user.id)
    .maybeSingle();

  const updates: Record<string, unknown> = {};
  let fileToDelete: string | null = null;

  if (typeof body.username === "string") {
    const username = body.username.trim().slice(0, 40);
    if (!/^[a-zA-Z0-9._\- ]{2,40}$/.test(username)) {
      return jsonError(
        "Use 2–40 letters, numbers, spaces, dots, dashes or underscores.",
        400
      );
    }
    updates.username = username;
  }

  // New flow: an uploaded avatar path under the user's own folder.
  if (body.avatarPath !== undefined) {
    const previous = (existingProfile?.avatar_url as string | null) ?? null;
    if (body.avatarPath === null) {
      updates.avatar_url = null;
      if (isStorageAvatar(previous)) fileToDelete = avatarStoragePath(previous);
    } else {
      const path = body.avatarPath;
      if (
        typeof path !== "string" ||
        path.length > 300 ||
        !path.startsWith(`${user.id}/`)
      ) {
        return jsonError("That avatar path is invalid.", 400);
      }
      updates.avatar_url = buildStorageAvatar(path);
      if (isStorageAvatar(previous) && previous !== updates.avatar_url) {
        fileToDelete = avatarStoragePath(previous);
      }
    }
  } else if (body.avatarUrl !== undefined) {
    // Legacy/external URL support (for example a Google profile picture).
    if (body.avatarUrl === null || body.avatarUrl === "") {
      updates.avatar_url = null;
    } else if (/^https?:\/\//i.test(body.avatarUrl)) {
      updates.avatar_url = body.avatarUrl.slice(0, 500);
    } else {
      return jsonError("Avatar URLs must start with http:// or https://.", 400);
    }
  }

  if (body.preferences && typeof body.preferences === "object") {
    updates.preferences = {
      ...((existingProfile?.preferences as ProfilePreferences | null) ?? {}),
      ...body.preferences,
    };
  }

  if (!Object.keys(updates).length) {
    return jsonError("No supported changes were provided.");
  }

  const { data, error: updateError } = existingProfile
    ? await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select("*")
        .single()
    : await supabase
        .from("profiles")
        .insert({ id: user.id, username: "friend", ...updates })
        .select("*")
        .single();

  if (updateError) return jsonError("Your profile could not be saved.", 500);

  // Best-effort cleanup of the replaced avatar file.
  if (fileToDelete) {
    try {
      await supabase.storage.from(AVATAR_BUCKET).remove([fileToDelete]);
    } catch {
      // Ignore: an orphaned file is harmless and can be swept later.
    }
  }

  return NextResponse.json({ profile: data });
}
