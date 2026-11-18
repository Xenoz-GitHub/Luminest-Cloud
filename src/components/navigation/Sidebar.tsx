"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bug,
  FolderOpen,
  Home,
  Plus,
  Scale,
  Share2,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Mascot } from "@/components/mascot/Mascot";
import { PerformanceToggle } from "@/components/performance/PerformanceToggle";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/files", label: "My Files", icon: FolderOpen },
  { href: "/shared", label: "Shared", icon: Share2 },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Sidebar({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col overflow-y-auto border-r-2 border-line/70 bg-background/85 backdrop-blur-xl lg:flex">
      <Atmosphere variant="sidebar" className="opacity-70" />
      <div className="safe-top relative flex h-20 items-center px-6">
        <Logo size="md" href="/home" />
      </div>

      <div className="relative mx-4 mb-3 overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/20 via-blush/30 to-softBlue/30 px-3 py-2.5">
        <Atmosphere variant="sidebar" />
        <div className="relative flex items-center gap-2">
          <Mascot state="welcome" size={54} animation="float" decorative />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-deep dark:text-primary-soft">
              Your little space
            </p>
            <p className="truncate text-[11px] font-semibold text-ink">
              Store. Organize. Explore.
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-4">
        <Link
          href="/upload"
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-primary-deep/30 bg-primary px-5 text-sm font-bold text-primary-ink shadow-toony-primary transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white hover:shadow-toony-primary-lg active:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(var(--accent-deep))]"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" strokeWidth={2.6} />
          Upload a file
        </Link>
      </div>

      <nav aria-label="Primary" className="relative mt-6 flex-1 px-3">
        <ul className="space-y-1">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/home" && pathname.startsWith(`${href}/`));
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition"
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-2xl bg-primary/15 ring-1 ring-primary/30"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                        active
                          ? "text-primary-deep dark:text-primary-soft"
                          : "text-muted group-hover:text-ink"
                      )}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    <span
                      className={cn(
                        "transition-colors",
                        active ? "text-ink" : "text-muted group-hover:text-ink"
                      )}
                    >
                      {label}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative space-y-3 border-t-2 border-line/70 p-4">
        <div className="flex items-center justify-between rounded-2xl border-2 border-line bg-surface/80 px-3 py-2">
          <span className="text-xs font-semibold text-muted">Appearance</span>
          <ThemeToggle />
        </div>

        <PerformanceToggle />

        <Link
          href="/legal"
          className="flex items-center gap-2 rounded-2xl border-2 border-line bg-surface/80 px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary/40 hover:bg-surface2 hover:text-ink"
        >
          <Scale className="h-3.5 w-3.5" /> Privacy &amp; Terms
        </Link>

        <Link
          href="/report"
          className="flex items-center gap-2 rounded-2xl border-2 border-line bg-surface/80 px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary/40 hover:bg-surface2 hover:text-ink"
        >
          <Bug className="h-3.5 w-3.5" /> Report a problem
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface/80 px-3 py-2.5 transition hover:border-primary/40 hover:bg-surface2"
        >
          <Avatar
            src={avatarUrl}
            name={username}
            size="sm"
            className="border-2 border-primary/40"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-ink">
              {username}
            </span>
            <span className="block truncate text-[11px] text-muted">
              View your profile
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
