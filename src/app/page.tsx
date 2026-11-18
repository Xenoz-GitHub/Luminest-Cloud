import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Brain,
  FolderHeart,
  Link2,
  ScanEye,
  Sparkles,
  Star,
} from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { HeroMascot } from "@/components/mascot/HeroMascot";
import { PublicHeader } from "@/components/navigation/PublicHeader";
import { InstallSection } from "@/components/marketing/InstallSection";
import { DeviceShowcase } from "@/components/marketing/DeviceShowcase";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { getOptionalUser } from "@/lib/auth";
import { APP_TAGLINE } from "@/lib/constants";

const FEATURES = [
  {
    icon: ScanEye,
    title: "See every page",
    description:
      "PDF pages, slides and images become soft, tap-friendly previews the moment they land.",
    tone: "bg-[#DCEBFA] text-[#356b9c] dark:bg-[#203a52] dark:text-[#a8d4fa]",
  },
  {
    icon: Brain,
    title: "Understand faster",
    description:
      "Pluggable AI reads the text you already own and writes a clear, faithful summary.",
    tone: "bg-[#F7DCE8] text-[#8d3449] dark:bg-[#472734] dark:text-[#ffb9ce]",
  },
  {
    icon: Link2,
    title: "Share a little link",
    description:
      "Send a branded LumiNest link with expiry, download controls and optional passwords.",
    tone: "bg-[#FFF0D8] text-[#7d5a17] dark:bg-[#443720] dark:text-[#ffdc95]",
  },
  {
    icon: FolderHeart,
    title: "Keep it cozy",
    description:
      "Folders, tags, favorites and a long-press quick look built for one-handed moments.",
    tone: "bg-[#E7DEFA] text-[#574184] dark:bg-[#352a4e] dark:text-[#d4c1fb]",
  },
];

const CTA_PRIMARY =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#6d5b90]/30 bg-primary px-7 text-sm font-bold text-[#3d3153] shadow-toony-primary transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white hover:shadow-toony-primary-lg active:translate-y-0.5 active:shadow-[0_1px_0_0_#6b55a4]";

const CTA_SECONDARY =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-line bg-surface/80 px-7 text-sm font-bold text-ink shadow-toony-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface2 active:translate-y-0.5 active:shadow-none";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; source?: string };
}) {
  // Safety net: if an OAuth/magic-link callback ever lands on the root with a
  // code (e.g. the Supabase redirect allow-list is missing /auth/callback),
  // forward it so the session still completes instead of silently failing.
  if (searchParams?.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(searchParams.code)}`);
  }

  let signedIn = false;
  try {
    const { user } = await getOptionalUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }

  // Older installs were published with start_url "/?source=pwa". Keep
  // forwarding those launches so existing installations still land in the app.
  if (signedIn && searchParams?.source === "pwa") {
    redirect("/home");
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 top-56 h-80 w-80 rounded-full bg-softBlue/50 blur-3xl" />
      </div>

      <PublicHeader signedIn={signedIn} />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="relative mt-4 overflow-hidden rounded-[32px] border-2 border-primary/15 bg-gradient-to-br from-primary/15 via-blush/25 to-softBlue/30 px-4 py-7 shadow-toony sm:mt-8 sm:px-8 sm:py-12 lg:px-10">
          <Atmosphere variant="landing" className="opacity-70 sm:opacity-100" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/25 bg-white/60 px-3 py-1.5 text-xs font-bold text-primary-deep shadow-toony-sm dark:bg-white/5 dark:text-primary-soft">
              <Sparkles className="h-3.5 w-3.5" />
              A cozy home for your files
            </span>
            <h1 className="mt-5 text-balance text-[2.15rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Your little space for{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-primary-deep dark:text-primary-soft">
                  everything
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 220 18"
                  className="absolute -bottom-1 left-0 h-4 w-full text-primary/40"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M3 13c40-8 130-10 214-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink/75 sm:mt-5 sm:text-lg lg:mx-0">
              LumiNest is a soft, smart cloud library for students, makers and
              anyone whose documents deserve a nicer home. Preview, organize,
              summarize and share — all from one tiny nest.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={signedIn ? "/home" : "/signup"}
                className={`${CTA_PRIMARY} w-full sm:w-auto`}
              >
                {signedIn ? "Back to my nest" : "Start nesting — it’s free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={signedIn ? "/upload" : "/login"}
                className={`${CTA_SECONDARY} w-full sm:w-auto`}
              >
                {signedIn ? "Upload a file" : "I already have a nest"}
              </Link>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted lg:justify-start">
              <Star className="h-3.5 w-3.5 fill-cream text-[#d9a93f]" />
              Private buckets, signed links, and no snooping.
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-md flex-wrap items-center justify-center">
            <div
              aria-hidden
              className="absolute h-64 w-64 rounded-full bg-gradient-to-br from-secondary via-blush to-softBlue opacity-70 blur-2xl sm:h-80 sm:w-80"
            />
            <HeroMascot className="relative z-10 sm:scale-110" />

            {/* On phones these ride below Lumi in normal flow so nothing is
                clipped; from sm upward they become the tilted overlay. */}
            {/* Decorative only. Hidden on phones: they added ~140px of scroll
                and crowded the copy without adding information. */}
            <div className="relative z-20 mt-3 hidden w-full flex-col items-center justify-center gap-2 sm:absolute sm:inset-0 sm:mt-0 sm:block">
              <div className="w-full max-w-[240px] rotate-[-2deg] rounded-2xl border-2 border-line bg-surface/90 px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-toony-sm backdrop-blur sm:absolute sm:left-0 sm:top-8 sm:w-auto sm:max-w-[175px] sm:rotate-[-6deg] sm:px-3 sm:py-2 sm:text-xs">
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-muted">
                  New summary
                </span>
                “3 main ideas ready” ✨
              </div>
              <div className="w-full max-w-[240px] rotate-[2deg] rounded-2xl border-2 border-line bg-surface/90 px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-toony-sm backdrop-blur sm:absolute sm:bottom-14 sm:right-0 sm:w-auto sm:max-w-[225px] sm:rotate-[5deg] sm:px-3 sm:py-2 sm:text-xs">
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-muted">
                  Shared link
                </span>
                <span className="block truncate">
                  luminest-cloud.vercel.app/s/cloud9
                </span>
              </div>
            </div>
          </div>
          </div>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-2">
            {["Organize", "Preview", "Summarize", "Share"].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/60 bg-white/70 px-3 py-1.5 text-xs font-bold text-primary-deep shadow-toony-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-primary-soft"
              >
                <Sparkles className="h-3 w-3" /> {item}
              </span>
            ))}
          </div>
        </section>

        <section
          id="features"
          className="mt-16 scroll-mt-28 sm:mt-24"
          aria-labelledby="features-heading"
        >
          <div className="mb-7 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
              Everything in one nest
            </p>
            <h2
              id="features-heading"
              className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
            >
              Built to feel like opening a tiny digital room.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description, tone }) => (
              <div
                key={title}
                className="group rounded-[28px] border-2 border-line bg-surface/80 p-5 shadow-toony backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:rotate-[-0.75deg] hover:border-primary/40 hover:shadow-toony-lg"
              >
                <span
                  className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl border-2 border-white/70 shadow-toony-sm dark:border-white/10 ${tone}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
                </span>
                <h3 className="text-base font-extrabold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="meet-lumi"
          className="mt-16 scroll-mt-28 overflow-hidden rounded-[32px] border-2 border-primary/20 bg-gradient-to-br from-primary/15 via-blush/30 to-softBlue/30 p-6 shadow-toony sm:mt-20 sm:p-10"
          aria-labelledby="meet-lumi-heading"
        >
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <Mascot expression="happy" size={170} glow />
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
                Meet Lumi
              </p>
              <h2
                id="meet-lumi-heading"
                className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
              >
                Your cloud-bunny librarian.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                Lumi floats beside you while you upload, search, summarize and
                share. She celebrates the wins, thinks hard about summaries, and
                never pretends a file is ready before it is.
              </p>
            </div>
            <div className="flex items-end gap-1">
              <Mascot expression="curious" size={72} animation="none" decorative />
              <Mascot expression="thinking" size={86} animation="none" decorative />
              <Mascot expression="cheerful" size={72} animation="none" decorative />
            </div>
          </div>
        </section>

        <DeviceShowcase />

        <InstallSection />

        <section
          id="get-started"
          className="mt-16 scroll-mt-28 text-center sm:mt-20"
        >
          <Mascot expression="excited" state="welcome" size={150} className="mx-auto" glow />
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Ready to feather your nest?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {APP_TAGLINE} Bring your next PDF, deck or camera roll — Lumi will
            help you make sense of it.
          </p>
          <Link
            href={signedIn ? "/home" : "/signup"}
            className={`${CTA_PRIMARY} mt-6`}
          >
            {signedIn ? "Open my nest" : "Create my free nest"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="relative z-10 border-t-2 border-line/60 py-6 text-center text-xs text-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <span>© {new Date().getFullYear()} LumiNest</span>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4 font-semibold">
            <Link href="/reviews" className="transition hover:text-ink">
              Reviews
            </Link>
            <Link href="/report" className="transition hover:text-ink">
              Report a bug
            </Link>
            <Link href="/privacy" className="transition hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-ink">
              Terms
            </Link>
          </nav>
          <span className="flex items-center gap-1">
            Made with care for your little space
            <Sparkles className="h-3 w-3 text-primary" />
          </span>
        </div>
      </footer>
    </div>
  );
}
