import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

export function LegalDocument({
  title,
  updated,
  intro,
  sections,
  otherHref,
  otherLabel,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  otherHref: string;
  otherLabel: string;
}) {
  return (
    <div className="relative min-h-dvh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-28 top-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 top-64 h-72 w-72 rounded-full bg-softBlue/40 blur-3xl" />
      </div>

      <header className="safe-top sticky top-0 z-40 border-b-2 border-line/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-2 px-4 sm:px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-transparent px-3 py-2 text-sm font-bold text-muted transition hover:border-primary/20 hover:bg-primary/10 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
          {APP_NAME} · Legal
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-xs font-semibold text-muted">Last updated {updated}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{intro}</p>

        <div className="mt-8 space-y-4">
          {sections.map((section, index) => (
            <section
              key={section.heading}
              className="rounded-[24px] border-2 border-line bg-surface/85 p-5 shadow-toony-sm"
            >
              <h2 className="flex items-baseline gap-2 text-base font-bold text-ink">
                <span className="text-xs font-extrabold text-primary-deep dark:text-primary-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] border-2 border-primary/20 bg-primary/5 p-5">
          <h2 className="text-base font-bold text-ink">Questions?</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Email us at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-primary-deep underline-offset-4 hover:underline dark:text-primary-soft"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            and we will help.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link
            href={otherHref}
            className="inline-flex items-center gap-1 font-semibold text-primary-deep hover:underline dark:text-primary-soft"
          >
            {otherLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/"
            className="text-muted transition hover:text-ink"
          >
            Back to {APP_NAME}
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t-2 border-line/60 py-6 text-center text-xs text-muted">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <nav aria-label="Legal" className="flex items-center gap-4 font-semibold">
            <Link href="/privacy" className="transition hover:text-ink">Privacy</Link>
            <Link href="/terms" className="transition hover:text-ink">Terms</Link>
          </nav>
          <span className="flex items-center gap-1">
            Made with care <Sparkles className="h-3 w-3 text-primary" />
          </span>
        </div>
      </footer>
    </div>
  );
}
