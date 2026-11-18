import { AppHeader } from "@/components/navigation/AppHeader";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SetupNotice } from "@/components/SetupNotice";
import { getProfile, hasSupabaseConfig } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseConfig()) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 py-10">
        <SetupNotice />
      </div>
    );
  }

  const { profile } = await getProfile();

  return (
    <div className="relative min-h-dvh lg:pl-72">
      <Sidebar username={profile.username} avatarUrl={profile.avatar_url} />

      <div className="lg:hidden">
        <AppHeader username={profile.username} avatarUrl={profile.avatar_url} />
      </div>

      {/* pb-32 clears the floating bottom nav (button + safe area) plus a
          little breathing room, so the last card is never covered. */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:pb-10">
        <OfflineBanner />
        {children}
      </main>

      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
