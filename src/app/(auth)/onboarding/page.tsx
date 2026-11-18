import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { profile, supabase } = await getProfile();

  // Returning users skip onboarding entirely.
  if (profile.preferences?.onboarded) redirect("/home");

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;

  const metaName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  const suggestedName =
    profile.username && profile.username !== "friend"
      ? profile.username
      : metaName.slice(0, 40);

  const metaAvatar =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  const avatarUrl = profile.avatar_url || metaAvatar;

  return (
    <OnboardingForm
      initialName={suggestedName}
      avatarUrl={avatarUrl}
      email={authUser?.email ?? ""}
    />
  );
}
