"use client";

import { Activity, Gauge, RotateCcw, Sparkles } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { cn } from "@/lib/utils";
import { PERF_LEVEL_COPY, usePerformance } from "./PerformanceProvider";

const OPTIMISED = [
  "Decorative animations and looping motion",
  "Blurred glass panels and heavy shadows",
  "Background glows and floating decorations",
  "Long transition delays",
];

export function PerformanceCard() {
  const {
    lite,
    level,
    evaluation,
    sources,
    autoOptimize,
    setAutoOptimize,
    enable,
    disable,
    suppressed,
    resetSuppression,
  } = usePerformance();

  const copy = PERF_LEVEL_COPY[level];

  return (
    <section
      aria-labelledby="performance-heading"
      className="overflow-hidden rounded-[28px] border-2 border-line bg-surface/85 shadow-toony-sm"
    >
      <div className="relative border-b-2 border-line/70 bg-gradient-to-br from-primary/10 via-blush/20 to-softBlue/25 px-5 py-4">
        <div className="flex items-center gap-3">
          <Mascot
            expression={lite ? "sleepy" : "thinking"}
            size={58}
            animation="none"
            decorative
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-deep dark:text-primary-soft">
              <Gauge className="h-3.5 w-3.5" /> Performance
            </p>
            <h2
              id="performance-heading"
              className="text-lg font-extrabold tracking-tight text-ink"
            >
              {lite ? "Performance Mode is on" : "Performance Mode is off"}
            </h2>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
              lite ? "bg-primary/25 text-primary-deep dark:text-primary-soft" : copy.tone
            )}
          >
            {lite ? "Lite" : copy.label}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className={cn("rounded-2xl px-4 py-3", copy.tone)}>
          <p className="flex items-center gap-1.5 text-xs font-bold">
            <Activity className="h-3.5 w-3.5" /> {copy.label}
          </p>
          <p className="mt-1 text-[11px] font-medium leading-relaxed opacity-90">
            {copy.description}
          </p>
          {evaluation && (
            <p className="mt-1.5 text-[10px] font-semibold opacity-75">
              {sources.length
                ? `Measured with: ${sources.join(", ")}`
                : "No supported performance APIs in this browser"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {lite ? (
            <button
              type="button"
              onClick={disable}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-line bg-surface px-4 text-xs font-bold text-ink shadow-toony-sm transition hover:-translate-y-0.5 hover:bg-surface2 active:translate-y-0.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restore original visuals
            </button>
          ) : (
            <button
              type="button"
              onClick={enable}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-[#6d5b90]/30 bg-primary px-4 text-xs font-bold text-[#3d3153] shadow-toony-primary transition hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white active:translate-y-0.5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Enable Performance Mode
            </button>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            What changes
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {OPTIMISED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary"
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Layout, text, buttons, navigation and every feature keep working
            exactly the same — only the decorative work is reduced.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border-2 border-line bg-surface2/50 px-3.5 py-3">
          <input
            type="checkbox"
            checked={autoOptimize}
            onChange={(event) => setAutoOptimize(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--accent-deep))]"
          />
          <span className="min-w-0">
            <span className="block text-xs font-bold text-ink">
              Turn it on automatically
            </span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
              If this device keeps struggling, Lumi will reduce effects for you.
              You can always switch back.
            </span>
          </span>
        </label>

        {suppressed && (
          <button
            type="button"
            onClick={resetSuppression}
            className="text-[11px] font-semibold text-primary-deep hover:underline dark:text-primary-soft"
          >
            Show performance suggestions again
          </button>
        )}
      </div>
    </section>
  );
}
