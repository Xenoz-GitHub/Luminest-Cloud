import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bug } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getOptionalUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { ReportForm } from "./ReportForm";

export const metadata: Metadata = {
  title: "Report a problem",
  description: `Tell us about a bug or problem in ${APP_NAME}.`,
};
export const dynamic = "force-dynamic";

export default async function ReportPage() {
  let email = "";
  try {
    const { user } = await getOptionalUser();
    email = user?.email ?? "";
  } catch {
    email = "";
  }

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

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-deep dark:text-primary-soft">
          <Bug className="h-3.5 w-3.5" /> Help us fix things
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Report a problem
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Something broken, confusing or missing? Tell us what happened and we
          will look into it. You do not need an account to send a report.
        </p>

        <div className="mt-6">
          <ReportForm defaultEmail={email} />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Just want to share a thought instead?{" "}
          <Link
            href="/reviews"
            className="font-semibold text-primary-deep hover:underline dark:text-primary-soft"
          >
            Leave a review
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
