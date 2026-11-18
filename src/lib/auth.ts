import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/avatar";
import type { Profile } from "@/types";

export async function requireUser() {
  if (!hasSupabaseConfig()) redirect("/login");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user, supabase };
}

export async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

export async function getProfile(): Promise<{
  user: { id: string; email?: string; created_at?: string };
  profile: Profile;
  supabase: SupabaseClient;
}> {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const fallbackName =
    (user.user_metadata?.username as string | undefined) ||
    user.email?.split("@")[0] ||
    "friend";

  const profile: Profile = data
    ? {
        ...data,
        preferences: (data.preferences ?? {}) as Profile["preferences"],
      }
    : {
        id: user.id,
        username: fallbackName,
        avatar_url: null,
        preferences: {},
        created_at: user.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

  // Storage-backed avatars are stored as "storage:<path>"; resolve them to a
  // short-lived signed URL for rendering without ever storing that URL.
  profile.avatar_url = await resolveAvatarUrl(supabase, profile.avatar_url);

  return { user, profile, supabase };
}

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
