"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bug,
  Database,
  HardDrive,
  Link2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { formatBytes, formatRelative } from "@/lib/format";
import type { AdminBugReport, AdminOverview } from "@/lib/admin/data";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-[#F7DCE8] text-[#a34b60] dark:bg-[#472734] dark:text-[#ffb9ce]",
  triaged: "bg-cream text-[#8a6414] dark:bg-[#3d3020] dark:text-[#ffdc95]",
  resolved:
    "bg-[#DDF3E8] text-[#2f7a5c] dark:bg-[#1f3a2e] dark:text-[#a7e6cb]",
  dismissed: "bg-surface2 text-muted",
};

export function AdminDashboard({
  overview,
  bugs,
}: {
  overview: AdminOverview;
  bugs: AdminBugReport[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const visibleBugs =
    filter === "all" ? bugs : bugs.filter((bug) => bug.status === filter);

  async function lock() {
    setBusy(true);
    await fetch("/api/blank-page/auth", { method: "DELETE" }).catch(() =>
      undefined
    );
    router.refresh();
  }

  async function setBugStatus(id: string, status: string) {
    setBusy(true);
    await fetch("/api/blank-page/bugs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => undefined);
    setBusy(false);
    router.refresh();
  }

  const stats = [
    {
      label: "Users",
      value: overview.users.total,
      sub: `+${overview.users.newLast7} this week`,
      icon: Users,
      tone: "bg-primary/15 text-primary-deep dark:text-primary-soft",
    },
    {
      label: "Files",
      value: overview.files.total,
      sub: formatBytes(overview.files.bytes),
      icon: HardDrive,
      tone: "bg-softBlue text-[#356b96]",
    },
    {
      label: "Summaries",
      value: overview.ai.summariesReady,
      sub: `${overview.ai.summariesFailed} failed`,
      icon: Sparkles,
      tone: "bg-[#F7DCE8] text-[#a34b60]",
    },
    {
      label: "Open bugs",
      value: overview.bugs.open,
      sub: `${overview.bugs.total} total`,
      icon: Bug,
      tone: "bg-cream text-[#8a6414]",
    },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b-2 border-line/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary-deep dark:text-primary-soft">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                Operator
              </p>
              <p className="text-sm font-extrabold text-ink">LumiNest control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3 text-xs font-bold text-ink transition hover:bg-surface2 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              type="button"
              onClick={lock}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3 text-xs font-bold text-ink transition hover:bg-surface2 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" /> Lock
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {stats.map(({ label, value, sub, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-2xl border-2 border-line bg-surface/85 p-3.5"
            >
              <span className={cn("grid h-8 w-8 place-items-center rounded-xl", tone)}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-2 text-2xl font-extrabold leading-none text-ink">
                {value}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-muted">{label}</p>
              <p className="text-[10px] text-muted/80">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Bug reports */}
          <section className="rounded-[24px] border-2 border-line bg-surface/85">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line/60 px-4 py-3">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Bug className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
                Bug reports
              </h2>
              <div className="flex flex-wrap gap-1">
                {["all", "open", "triaged", "resolved", "dismissed"].map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold capitalize transition",
                        filter === value
                          ? "bg-primary/20 text-primary-deep dark:text-primary-soft"
                          : "text-muted hover:bg-surface2"
                      )}
                    >
                      {value}
                    </button>
                  )
                )}
              </div>
            </div>

            <ul className="max-h-[520px] divide-y divide-line/60 overflow-y-auto">
              {visibleBugs.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-muted">
                  No reports in this view.
                </li>
              )}
              {visibleBugs.map((bug) => (
                <li key={bug.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">
                        {bug.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {bug.category} · {bug.email ?? "anonymous"} ·{" "}
                        {formatRelative(bug.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                        STATUS_STYLES[bug.status] ?? STATUS_STYLES.dismissed
                      )}
                    >
                      {bug.status}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                    {bug.details}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["triaged", "resolved", "dismissed"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={busy || bug.status === status}
                        onClick={() => setBugStatus(bug.id, status)}
                        className="rounded-full border-2 border-line bg-surface px-2.5 py-1 text-[10px] font-bold capitalize text-muted transition hover:border-primary/40 hover:text-ink disabled:opacity-40"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-4">
            {/* Pipeline health */}
            <section className="rounded-[24px] border-2 border-line bg-surface/85 p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Activity className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
                Processing
              </h2>
              <ul className="mt-3 space-y-2 text-xs">
                {[
                  ["Previews ready", overview.files.previewReady],
                  ["Queued / processing", overview.files.previewQueued],
                  ["Preview failures", overview.files.previewFailed],
                  ["In trash", overview.files.inTrash],
                ].map(([label, value]) => (
                  <li
                    key={String(label)}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-muted">{label}</span>
                    <span className="font-bold text-ink">{value}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Sharing + reviews */}
            <section className="rounded-[24px] border-2 border-line bg-surface/85 p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Link2 className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
                Sharing &amp; reviews
              </h2>
              <ul className="mt-3 space-y-2 text-xs">
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted">Active links</span>
                  <span className="font-bold text-ink">
                    {overview.sharing.active}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted">Revoked</span>
                  <span className="font-bold text-ink">
                    {overview.sharing.revoked}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted">Expired</span>
                  <span className="font-bold text-ink">
                    {overview.sharing.expired}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 border-t border-line/60 pt-2">
                  <span className="flex items-center gap-1 text-muted">
                    <Star className="h-3 w-3" /> Reviews
                  </span>
                  <span className="font-bold text-ink">
                    {overview.reviews.total} ·{" "}
                    {overview.reviews.average.toFixed(1)}★
                  </span>
                </li>
              </ul>
            </section>

            {/* Storage leaders */}
            <section className="rounded-[24px] border-2 border-line bg-surface/85 p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Database className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
                Heaviest accounts
              </h2>
              <ul className="mt-3 space-y-1.5 text-xs">
                {overview.storageTopUsers.length === 0 && (
                  <li className="text-muted">No files yet.</li>
                )}
                {overview.storageTopUsers.map((row) => (
                  <li
                    key={row.userId}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-muted">{row.username}</span>
                    <span className="shrink-0 font-bold text-ink">
                      {formatBytes(row.bytes)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Newest users */}
          <section className="rounded-[24px] border-2 border-line bg-surface/85 p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <Users className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
              Newest accounts
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              {overview.recentUsers.length === 0 && (
                <li className="text-muted">No accounts yet.</li>
              )}
              {overview.recentUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate font-semibold text-ink">
                    {user.username}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted">
                    {user.plan} · {formatRelative(user.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Audit log */}
          <section className="rounded-[24px] border-2 border-line bg-surface/85 p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <ShieldCheck className="h-4 w-4 text-primary-deep dark:text-primary-soft" />
              Audit log
            </h2>
            <ul className="mt-3 space-y-1.5 font-mono text-[11px]">
              {overview.auditLog.length === 0 && (
                <li className="font-sans text-muted">No entries yet.</li>
              )}
              {overview.auditLog.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      entry.success ? "bg-[#7FC8A9]" : "bg-[#E892A2]"
                    )}
                  />
                  <span className="truncate text-ink">{entry.action}</span>
                  <span className="ml-auto shrink-0 text-muted">
                    {formatRelative(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
