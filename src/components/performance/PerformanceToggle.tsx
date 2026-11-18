"use client";

import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerformance } from "./PerformanceProvider";

/** Compact Performance Mode switch for the desktop sidebar footer. */
export function PerformanceToggle() {
  const { lite, toggle } = usePerformance();

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={lite}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2 text-xs font-semibold transition",
        lite
          ? "border-primary/50 bg-primary/15 text-ink"
          : "border-line bg-surface/80 text-muted hover:border-primary/40 hover:bg-surface2 hover:text-ink"
      )}
    >
      <span className="flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5" />
        Performance Mode
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-4 w-7 shrink-0 rounded-full transition",
          lite ? "bg-primary-deep" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all",
            lite ? "left-3.5" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
