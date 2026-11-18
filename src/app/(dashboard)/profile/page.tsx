import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  HardDrive,
  Bug,
  Heart,
  LifeBuoy,
  LogOut,
  Moon,
  Palette,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ThemePicker } from "@/components/ui/ThemePicker";
import { AccentPicker } from "@/components/ui/AccentPicker";
import { getProfile } from "@/lib/auth";
import { getStorageSummary } from "@/lib/files-server";
import { formatBytes, formatDate, percent } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { FileCategory } from "@/types";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

const CATEGORY_ORDER: FileCategory[] = [
  "pdf",
  "document",
  "presentation",
  "image",
  "text",
  "other",
];

const CATEGORY_BAR: Record<FileCategory, string> = {
  pdf: "bg-[#E892A2]",
  document: "bg-[#9EC7EE]",
  presentation: "bg-[#F3C677]",
  image: "bg-[#8FD3B6]",
  text: "bg-primary",
  other: "bg-muted/40",
};

export default async function ProfilePage() {
  const { user, profile, supabase } = await getProfile();

  const [
    storage,
    { count: favoriteCount },
    { count: activeShareCount },
    { count: summaryCount },
  ] = await Promise.all([
    getStorageSummary(supabase, user.id),
    supabase
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_favorite", true)
      .is("deleted_at", null),
    supabase
      .from("share_links")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("revoked_at", null),
    supabase
      .from("file_summaries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "ready"),
  ]);

  const usedPercent = percent(storage.usedBytes, storage.quotaBytes);
  const freeBytes = Math.max(0, storage.quotaBytes - storage.usedBytes);
  const email = user.email ?? "Signed in";

  const stats = [
    {
      label: "Files",
      value: storage.fileCount,
      icon: FolderOpen,
      tone: "bg-primary/15 text-primary-deep dark:text-primary-soft",
    },
    {
      label: "Folders",
      value: storage.folderCount,
      icon: FolderOpen,
      tone: "bg-softBlue text-[#356b96]",
    },
    {
      label: "Favorites",
      value: favoriteCount ?? 0,
      icon: Heart,
      tone: "bg-[#F7DCE8] text-[#a34b60]",
    },
    {
      label: "Summaries",
      value: summaryCount ?? 0,
      icon: Sparkles,
      tone: "bg-cream text-[#8a6414]",
    },
    {
      label: "Active links",
      value: activeShareCount ?? 0,
      icon: ShieldCheck,
      tone: "bg-[#DDF3E8] text-[#2f7a5c]",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
          Your little corner
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Make LumiNest feel like yours, and see what is taking up space.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-2.5 p-3">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-extrabold leading-none text-ink">
                {value}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-muted">
                {label}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-ink">Your details</h2>
            <p className="mt-0.5 text-xs text-muted">
              This name appears in your dashboard greeting.
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted">
              <CalendarDays className="h-3 w-3" /> Joined{" "}
              {formatDate(profile.created_at)}
            </p>
          </div>
          <ProfileForm profile={profile} email={email} />
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-ink">
              <HardDrive className="h-4 w-4 text-primary-deep dark:text-primary-soft" />{" "}
              Storage
            </h2>
            <div className="mt-3 flex items-center gap-4">
              <ProgressRing
                value={usedPercent}
                size={112}
                label={
                  <div>
                    <p className="text-xl font-extrabold text-ink">
                      {formatBytes(storage.usedBytes)}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      of {formatBytes(storage.quotaBytes)}
                    </p>
                  </div>
                }
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-bold text-ink">
                  {formatBytes(freeBytes)} free
                </p>
                <p className="text-[11px] leading-relaxed text-muted">
                  Space is counted across your library. Files in the bin still
                  count until deleted forever.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-line/70 pt-3">
              {CATEGORY_ORDER.map((category) => {
                const entry = storage.byCategory[category];
                if (!entry.count) return null;
                return (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-ink">
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="text-muted">
                        {entry.count} · {formatBytes(entry.bytes)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                      <div
                        className={`h-full rounded-full ${CATEGORY_BAR[category]}`}
                        style={{
                          width: `${percent(entry.bytes, storage.usedBytes || 1)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {storage.usedBytes === 0 && (
                <p className="text-xs text-muted">
                  Nothing stored yet. Your first upload will show up here.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-ink">
              <Moon className="h-4 w-4 text-primary-deep dark:text-primary-soft" />{" "}
              Appearance
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Choose light, dark, or follow your device.
            </p>
            <div className="mt-3">
              <ThemePicker />
            </div>

            <div className="mt-4 border-t border-line/70 pt-3">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Palette className="h-3.5 w-3.5 text-primary-deep dark:text-primary-soft" />{" "}
                Accent color
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                Pick the color Lumi wears around your nest.
              </p>
              <div className="mt-3">
                <AccentPicker initial={profile.preferences?.accent ?? null} />
              </div>
            </div>
          </Card>

          <PerformanceCard />

          <Card className="p-5">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-ink">
              <Scale className="h-4 w-4 text-primary-deep dark:text-primary-soft" />{" "}
              Privacy &amp; Terms
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Read how LumiNest handles your data, and the rules for using your
              nest — anytime, from inside the app.
            </p>
            <Link
              href="/legal"
              className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-ink shadow-sm transition hover:bg-surface2"
            >
              <Scale className="h-3.5 w-3.5" /> Open legal
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-ink">
              <LifeBuoy className="h-4 w-4 text-primary-deep dark:text-primary-soft" />{" "}
              Help &amp; feedback
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Something broken or confusing? Tell us — and see what others say
              about LumiNest.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/report"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-ink shadow-toony-primary transition hover:bg-primary-deep hover:text-white"
              >
                <Bug className="h-3.5 w-3.5" /> Report a problem
              </Link>
              <Link
                href="/reviews"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-ink shadow-sm transition hover:bg-surface2"
              >
                <Star className="h-3.5 w-3.5" /> Reviews
              </Link>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-bold text-ink">Session</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Signing out only ends this session. Your files stay safely in your
              nest.
            </p>
            <form action="/auth/signout" method="POST" className="mt-3">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-ink shadow-sm transition hover:bg-surface2"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
