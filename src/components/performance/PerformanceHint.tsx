"use client";

import { Gauge, Sparkles, X } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { usePerformance } from "./PerformanceProvider";
import { cn } from "@/lib/utils";

/**
 * A single, dismissible performance suggestion.
 *
 * It appears at most once per degraded streak, never repeats after a dismiss
 * (see `dismissAndSuppress`), and never covers the bottom navigation on mobile.
 */
export function PerformanceHint() {
  const { suggestion, enable, disable, dismissSuggestion, dismissAndSuppress } =
    usePerformance();

  if (!suggestion) return null;

  const isAuto = suggestion === "auto";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-3 z-[60] animate-pop sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]",
        // Clears the floating mobile bottom nav and the home indicator.
        "bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] sm:bottom-6"
      )}
    >
      <div className="overflow-hidden rounded-[26px] border-2 border-primary/25 bg-surface/95 p-4 shadow-float backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <Mascot
            expression={isAuto ? "cheerful" : "thinking"}
            size={64}
            animation="none"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-deep dark:text-primary-soft">
              <Gauge className="h-3 w-3" />
              {isAuto ? "Performance Mode on" : "Performance notice"}
            </p>
            <p className="mt-1 text-sm font-bold leading-snug text-ink">
              {isAuto
                ? "Lumi toned things down for you."
                : "This page may feel slower than usual."}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {isAuto
                ? "Unnecessary animations and effects were reduced automatically. You can undo this any time."
                : "Your device seems to be working hard. Enable Performance Mode for a smoother experience."}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {isAuto ? (
                <button
                  type="button"
                  onClick={disable}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3.5 text-xs font-bold text-ink transition hover:bg-surface2 active:translate-y-0.5"
                >
                  Restore visuals
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enable}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-[#6d5b90]/30 bg-primary px-3.5 text-xs font-bold text-[#3d3153] shadow-toony-primary transition hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white active:translate-y-0.5"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Enable Performance Mode
                </button>
              )}
              <button
                type="button"
                onClick={dismissSuggestion}
                className="inline-flex h-9 items-center rounded-full px-2.5 text-xs font-semibold text-muted transition hover:text-ink"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissAndSuppress}
            aria-label="Dismiss and don't ask again"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
