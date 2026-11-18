"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#showcase", label: "Showcase" },
  { href: "#install", label: "Install" },
  { href: "/reviews", label: "Reviews" },
  { href: "#get-started", label: "Get started" },
];

const PRIMARY_CTA =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border-2 border-[#6d5b90]/30 bg-primary px-4 text-sm font-bold text-[#3d3153] shadow-toony-primary transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white active:translate-y-0.5 active:shadow-[0_1px_0_0_#6b55a4]";

export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <header className="safe-top sticky top-0 z-50 border-b-2 border-line/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:h-[72px] sm:px-6">
        <Logo size="md" />

        <nav
          aria-label="Landing navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border-2 border-transparent px-3.5 py-2 text-sm font-bold text-ink transition hover:border-primary/20 hover:bg-primary/10 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/home" className={cn(PRIMARY_CTA, "hidden sm:inline-flex")}>
              Open my nest <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-10 items-center rounded-full border-2 border-transparent px-3.5 text-sm font-bold text-ink transition hover:border-primary/20 hover:bg-primary/10 md:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={cn(PRIMARY_CTA, "hidden sm:inline-flex")}
              >
                Make my nest
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="public-mobile-nav"
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-line bg-surface/80 text-ink shadow-toony-sm transition hover:bg-surface2 active:translate-y-0.5 active:shadow-none md:hidden"
          >
            {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="public-mobile-nav"
          className="border-t-2 border-line/70 bg-background/95 px-4 pb-4 pt-2 shadow-panel backdrop-blur-xl md:hidden"
        >
          <nav aria-label="Mobile landing navigation" className="mx-auto max-w-6xl">
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-2xl border-2 border-transparent px-3 py-2.5 text-sm font-bold text-ink transition hover:border-line hover:bg-surface2"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4 text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mx-auto mt-2 grid max-w-6xl grid-cols-2 gap-2 sm:hidden">
            {signedIn ? (
              <Link
                href="/home"
                onClick={() => setOpen(false)}
                className={cn(PRIMARY_CTA, "col-span-2")}
              >
                Open my nest <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-full border-2 border-line bg-surface px-4 text-sm font-bold text-ink shadow-toony-sm transition hover:bg-surface2 active:translate-y-0.5 active:shadow-none"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className={PRIMARY_CTA}
                >
                  Make my nest
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
