import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileImage,
  FileText,
  FolderOpen,
  FolderHeart,
  Heart,
  Presentation,
  Search,
  Share2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { FileGrid } from "@/components/files/FileGrid";
import { FolderManager } from "@/components/folders/FolderManager";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProfile } from "@/lib/auth";
import {
  attachFileListItems,
  getFolderFileCounts,
  getStorageSummary,
} from "@/lib/files-server";
import {
  formatBytes,
  getCategoryLabel,
  percent,
  stripExtension,
} from "@/lib/format";
import type { FileRecord, FolderRecord } from "@/types";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, profile, supabase } = await getProfile();

  const [
    { data: recentData },
    storage,
    { data: folderData },
    folderCounts,
    { count: favoriteCount },
    { count: activeShareCount },
    { data: summaryCandidate },
    { count: summaryCount },
  ] = await Promise.all([
    supabase
      .from("files")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    getStorageSummary(supabase, user.id),
    supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    getFolderFileCounts(supabase, user.id),
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
      .from("files")
      .select("id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .in("summary_status", ["none", "failed"])
      .not("extracted_text", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("file_summaries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "ready"),
  ]);

  const recent = await attachFileListItems(
    supabase,
    user.id,
    (recentData as FileRecord[] | null) ?? []
  );
  const folders = (folderData as FolderRecord[] | null) ?? [];
  const topFolders = folders.filter((folder) => !folder.parent_id).slice(0, 4);

  const usedPercent = percent(storage.usedBytes, storage.quotaBytes);
  const firstName = profile.username.split(/\s+/)[0] || "friend";
  const summaryHref = summaryCandidate?.id
    ? `/files/${summaryCandidate.id}`
    : "/files";

  const categories = [
    {
      label: "PDFs",
      href: "/files?type=pdf",
      count: storage.byCategory.pdf.count,
      icon: FileText,
      tone: "bg-[#F7DCE8] text-[#a34b60]",
    },
    {
      label: "Documents",
      href: "/files?type=document",
      count: storage.byCategory.document.count,
      icon: FileText,
      tone: "bg-softBlue text-[#356b96]",
    },
    {
      label: "Presentations",
      href: "/files?type=presentation",
      count: storage.byCategory.presentation.count,
      icon: Presentation,
      tone: "bg-cream text-[#8a6414]",
    },
    {
      label: "Images",
      href: "/files?type=image",
      count: storage.byCategory.image.count,
      icon: FileImage,
      tone: "bg-[#DDF3E8] text-[#2f7a5c]",
    },
    {
      label: "Favorites",
      href: "/files?favorite=1",
      count: favoriteCount ?? 0,
      icon: Heart,
      tone: "bg-primary/15 text-primary-deep dark:text-primary-soft",
    },
    {
      label: "Text files",
      href: "/files?type=text",
      count: storage.byCategory.text.count,
      icon: FileText,
      tone: "bg-surface2 text-muted",
    },
  ];

  const quickActions = [
    {
      label: "Upload",
      description: "Bring a file home",
      href: "/upload",
      icon: UploadCloud,
      tone: "bg-primary/15 text-primary-deep dark:text-primary-soft",
    },
    {
      label: "My files",
      description: "Browse everything",
      href: "/files",
      icon: FolderOpen,
      tone: "bg-softBlue text-[#356b96]",
    },
    {
      label: "Shared",
      description: "Manage little links",
      href: "/shared",
      icon: Share2,
      tone: "bg-cream text-[#8a6414]",
    },
    {
      label: "AI summary",
      description: "Let Lumi read it",
      href: summaryHref,
      icon: Sparkles,
      tone: "bg-[#F7DCE8] text-[#a34b60]",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] border-2 border-primary/20 bg-gradient-to-br from-primary/20 via-blush/35 to-softBlue/40 p-5 shadow-toony sm:p-7">
        <Atmosphere variant="dashboard" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl dark:bg-white/5"
        />
        <div className="relative flex items-center gap-3 sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-deep dark:text-primary-soft">
              Welcome back
            </p>
            <h1 className="mt-1.5 text-balance text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Hi, {firstName}! Your nest is cozy.
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              {storage.fileCount
                ? `You have ${storage.fileCount} ${
                    storage.fileCount === 1 ? "file" : "files"
                  } tucked away. Lumi kept everything where you left it.`
                : "Your nest is ready for its very first file. Lumi is already excited."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/upload"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-[#6d5b90]/30 bg-primary px-4 text-xs font-bold text-[#3d3153] shadow-toony-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white active:translate-y-0.5 active:shadow-[0_1px_0_0_#6b55a4] sm:text-sm"
              >
                <UploadCloud className="h-4 w-4" /> Upload a file
              </Link>
              <Link
                href="/files"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-line bg-surface/80 px-4 text-xs font-bold text-ink shadow-toony-sm transition-all hover:-translate-y-0.5 hover:bg-surface2 active:translate-y-0.5 active:shadow-none sm:text-sm"
              >
                Browse my files <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <span className="w-[84px] shrink-0 sm:w-[156px]">
            <Mascot
              state="welcome"
              size={156}
              fluid
              animation="float"
              glow
              priority
              className="sm:scale-110"
            />
          </span>
        </div>
      </section>

      <form
        action="/files"
        method="get"
        role="search"
        className="relative flex items-center"
      >
        <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
        <input
          type="search"
          name="q"
          placeholder="Search by name or inside a document…"
          aria-label="Search your files"
          className="h-12 w-full rounded-full border-2 border-line bg-surface pl-11 pr-24 text-sm text-ink shadow-toony-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:shadow-none focus:ring-4 focus:ring-primary/15"
        />
        <button
          type="submit"
          className="absolute right-1.5 inline-flex h-9 items-center rounded-full border-2 border-[#6d5b90]/25 bg-primary px-4 text-xs font-bold text-[#3d3153] transition hover:bg-primary-deep hover:text-white active:translate-y-0.5"
        >
          Search
        </button>
      </form>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "Files", value: storage.fileCount, href: "/files" },
          { label: "Folders", value: storage.folderCount, href: "/files" },
          { label: "Shared links", value: activeShareCount ?? 0, href: "/shared" },
          { label: "AI summaries", value: summaryCount ?? 0, href: "/files" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border-2 border-line bg-surface/80 px-3.5 py-3 shadow-toony-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-toony"
          >
            <p className="text-xl font-extrabold text-ink">{stat.value}</p>
            <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <section aria-labelledby="recent-heading">
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-deep dark:text-primary-soft">
                Fresh from the nest
              </p>
              <h2
                id="recent-heading"
                className="text-lg font-bold tracking-tight text-ink"
              >
                Recent files
              </h2>
            </div>
            <Link
              href="/files"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-deep hover:underline dark:text-primary-soft"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length ? (
            <FileGrid files={recent} view="grid" />
          ) : (
            <EmptyState
              state="empty-library"
              title="Your nest is waiting"
              description="Upload a PDF, a deck, a photo or a text file. Lumi will make it easy to preview, find and summarize."
              action={
                <Link
                  href="/upload"
                  className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#6d5b90]/30 bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-toony-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white active:translate-y-0.5 active:shadow-[0_1px_0_0_#6b55a4]"
                >
                  <UploadCloud className="h-4 w-4" /> Upload your first file
                </Link>
              }
            />
          )}
        </section>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-deep dark:text-primary-soft">
                  Your space
                </p>
                <h2 className="text-base font-bold text-ink">Storage</h2>
              </div>
              <Link
                href="/profile"
                className="text-[11px] font-semibold text-primary-deep hover:underline dark:text-primary-soft"
              >
                Details
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing value={usedPercent} size={112} stroke={10} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">
                  {formatBytes(storage.usedBytes)} used
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  of {formatBytes(storage.quotaBytes)} free
                </p>
                <div className="mt-3 space-y-1.5">
                  {(["pdf", "image", "document"] as const).map((category) => {
                    const share = percent(
                      storage.byCategory[category].bytes,
                      Math.max(1, storage.usedBytes)
                    );
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-muted">
                          <span>{getCategoryLabel(category)}</span>
                          <span>{formatBytes(storage.byCategory[category].bytes)}</span>
                        </div>
                        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(2, share)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-deep dark:text-primary-soft">
                  Quick shelves
                </p>
                <h2 className="text-base font-bold text-ink">Find by type</h2>
              </div>
              <FolderHeart className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(({ label, href, count, icon: Icon, tone }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex items-center gap-2 rounded-2xl border-2 border-line/70 bg-surface2/50 px-2.5 py-2 transition hover:border-primary/40 hover:bg-surface2"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-bold text-ink">
                      {label}
                    </span>
                    <span className="block text-[10px] text-muted">
                      {count} {count === 1 ? "file" : "files"}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <FolderManager
        folders={topFolders}
        counts={folderCounts}
        title="Your folders"
        description={
          folders.length > topFolders.length
            ? "Your most recent top-level folders. See all of them in My Files."
            : "Little shelves for keeping like things together."
        }
      />

      <section aria-labelledby="quick-actions-heading">
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-deep dark:text-primary-soft">
            One tap away
          </p>
          <h2
            id="quick-actions-heading"
            className="text-lg font-bold tracking-tight text-ink"
          >
            Quick actions
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {quickActions.map(({ label, description, href, icon: Icon, tone }) => (
            <Link
              key={label}
              href={href}
              className="group rounded-[28px] border-2 border-line bg-surface/85 p-4 shadow-toony-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-toony"
            >
              <span className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-bold text-ink">{label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && summaryCandidate?.id && (
        <section className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <Mascot state="generating-summary" size={78} animation="none" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">
                {stripExtension(
                  recent.find((file) => file.id === summaryCandidate.id)?.name ??
                    "One of your documents"
                )}{" "}
                is ready for a summary.
              </p>
              <p className="text-xs text-muted">
                Lumi can read the extracted text and write the overview for you.
              </p>
            </div>
            <Link
              href={summaryHref}
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-[#3d3153] shadow-sm transition hover:bg-primary-deep hover:text-white"
            >
              Summarize
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
