"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Wrench } from "lucide-react";

/**
 * One-tap repair for an installed app that will not open.
 *
 * Visiting /reset unregisters the service worker, deletes every cache, and
 * sends the user back to the app. This replaces "clear site data in Chrome
 * settings", which is the step users should never have to know about.
 *
 * User files are untouched: they live in Supabase, never in browser storage.
 */
export function ResetClient() {
  const [state, setState] = useState<"ready" | "working" | "done" | "error">(
    "ready"
  );

  const run = useCallback(async () => {
    setState("working");
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      try {
        sessionStorage.clear();
      } catch {
        // Ignore storage failures.
      }
      setState("done");
      window.setTimeout(() => {
        window.location.replace("/launch");
      }, 900);
    } catch {
      setState("error");
    }
  }, []);

  // Try automatically; the button below is the manual fallback.
  useEffect(() => {
    void run();
  }, [run]);

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border-2 border-line bg-surface/90 p-6 text-center shadow-toony sm:p-8">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary-deep dark:text-primary-soft">
          {state === "done" ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <Wrench className="h-6 w-6" />
          )}
        </span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink">
          {state === "done" ? "Repaired" : "Repairing LumiNest"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {state === "done"
            ? "Reopening your nest. Your files were never stored in the browser, so nothing was lost."
            : state === "error"
              ? "Something blocked the automatic repair. Tap the button below."
              : "Clearing a stale app cache. This does not affect your files."}
        </p>

        {state !== "done" && (
          <button
            type="button"
            onClick={run}
            disabled={state === "working"}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#6d5b90]/30 bg-primary px-5 text-sm font-bold text-[#3d3153] transition hover:bg-primary-deep hover:text-white disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${state === "working" ? "animate-spin" : ""}`}
            />
            {state === "working" ? "Working…" : "Repair now"}
          </button>
        )}

        <a
          href="/launch"
          className="mt-4 block text-xs font-semibold text-primary-deep hover:underline dark:text-primary-soft"
        >
          Open LumiNest instead
        </a>
      </div>
    </div>
  );
}
