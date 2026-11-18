import type { ReactNode } from "react";
import { FileText, Folder, Image as ImageIcon, Presentation, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

type AtmosphereVariant = "landing" | "dashboard" | "sidebar";

interface AtmosphereProps {
  variant?: AtmosphereVariant;
  className?: string;
}

const SPARKLES = [
  { top: "10%", left: "7%", size: "h-3 w-3", delay: "0s" },
  { top: "20%", left: "84%", size: "h-4 w-4", delay: "0.8s" },
  { top: "62%", left: "10%", size: "h-3.5 w-3.5", delay: "1.4s" },
  { top: "78%", left: "90%", size: "h-3 w-3", delay: "2.1s" },
  { top: "44%", left: "50%", size: "h-2.5 w-2.5", delay: "1.1s" },
];

export function Atmosphere({ variant = "landing", className }: AtmosphereProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {/* Dreamy cloud glows. Kept subtle so text on top of them stays legible. */}
      <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -right-24 top-2 h-72 w-72 rounded-full bg-softBlue/25 blur-3xl" />
      <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-blush/20 blur-3xl" />

      {/* Cloud puffs are decorative only: hidden on phones, where they used to
          wash out the hero copy sitting on top of them. */}
      <CloudPuff className="absolute right-3 top-3 hidden h-24 w-24 opacity-60 sm:block sm:h-32 sm:w-32" />
      <CloudPuff className="absolute -left-3 bottom-1 hidden h-20 w-20 opacity-50 sm:block sm:h-28 sm:w-28" />

      {/* Twinkles */}
      {SPARKLES.map((s, i) => (
        <Sparkle
          key={i}
          className={cn(
            "absolute animate-twinkle text-primary-deep/40 dark:text-primary-soft/40",
            s.size
          )}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          strokeWidth={1.6}
        />
      ))}

      {/* Floating file icons (landing only, hidden on tiny screens) */}
      {variant === "landing" && (
        <>
          <FloatingTile className="left-3 top-16 hidden sm:grid" delay="0s">
            <FileText className="h-5 w-5" />
          </FloatingTile>
          <FloatingTile className="right-4 top-24 hidden sm:grid" delay="1.2s">
            <ImageIcon className="h-5 w-5" />
          </FloatingTile>
          <FloatingTile className="bottom-10 left-6 hidden sm:grid" delay="2.4s">
            <Folder className="h-5 w-5" />
          </FloatingTile>
          <FloatingTile className="bottom-16 right-8 hidden sm:grid" delay="0.6s">
            <Presentation className="h-5 w-5" />
          </FloatingTile>
        </>
      )}
    </div>
  );
}

function CloudPuff({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      fill="currentColor"
      className={cn("text-white/70 dark:text-white/10", className)}
    >
      <ellipse cx="28" cy="44" rx="26" ry="16" />
      <ellipse cx="52" cy="30" rx="26" ry="20" />
      <ellipse cx="74" cy="44" rx="22" ry="14" />
    </svg>
  );
}

function FloatingTile({
  children,
  className,
  delay,
}: {
  children: ReactNode;
  className?: string;
  delay?: string;
}) {
  return (
    <span
      className={cn(
        "absolute place-items-center rounded-2xl border-2 border-white/60 bg-white/70 p-2.5 text-primary-deep shadow-toony-sm backdrop-blur-sm animate-float dark:border-white/10 dark:bg-white/5 dark:text-primary-soft",
        className
      )}
      style={{ animationDelay: delay }}
    >
      {children}
    </span>
  );
}
