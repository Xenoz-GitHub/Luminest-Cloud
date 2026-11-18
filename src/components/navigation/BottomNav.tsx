"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Home, Plus, Share2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/files", label: "My Files", icon: FolderOpen },
  { href: "/upload", label: "Upload", icon: Plus, primary: true },
  { href: "/shared", label: "Shared", icon: Share2 },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Primary"
        className="pointer-events-auto w-full max-w-[560px] rounded-[30px] border-2 border-line bg-surface/90 px-2 py-2 shadow-float backdrop-blur-xl"
      >
        <ul className="grid grid-cols-5 items-end">
          {ITEMS.map(({ href, label, icon: Icon, primary }) => {
            const active =
              pathname === href ||
              (href !== "/home" && pathname.startsWith(`${href}/`));
            if (primary) {
              return (
                <li key={href} className="flex justify-center">
                  <Link
                    href={href}
                    aria-label="Upload a file"
                    aria-current={active ? "page" : undefined}
                    className="-mt-7 grid h-14 w-14 place-items-center rounded-full border-2 border-white/40 bg-gradient-to-br from-primary to-primary-deep text-white shadow-float ring-4 ring-background transition-transform hover:-rotate-6 hover:scale-105 active:translate-y-0.5 active:scale-95 dark:border-white/20"
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </Link>
                </li>
              );
            }
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold transition",
                    active
                      ? "text-primary-deep dark:text-primary-soft"
                      : "text-muted hover:text-ink"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-10 place-items-center rounded-xl transition",
                      active && "bg-primary/15"
                    )}
                  >
                    <Icon
                      className={cn("h-[19px] w-[19px]", active && "stroke-[2.4]")}
                    />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
