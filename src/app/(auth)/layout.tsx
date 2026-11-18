import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Mascot } from "@/components/mascot/Mascot";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-softBlue/50 blur-3xl" />
      </div>
      <header className="safe-top sticky top-0 z-40 border-b-2 border-line/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-full border-2 border-transparent px-4 py-2 text-sm font-bold text-muted transition hover:border-primary/20 hover:bg-primary/10 hover:text-ink"
            >
              Back home
            </Link>
          </div>
        </div>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
        <div className="grid w-full max-w-4xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden flex-col items-center text-center lg:flex">
            <Mascot expression="excited" pose="welcoming" size={280} glow priority />
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
              Welcome to the nest.
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
              Lumi keeps an eye on your files, remembers the little things, and
              celebrates every upload with you.
            </p>
          </div>
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
