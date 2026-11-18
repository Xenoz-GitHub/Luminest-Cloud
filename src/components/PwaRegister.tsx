"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";

/** How often to ask the server whether a newer worker exists. */
const CHECK_INTERVAL_MS = 60_000;

/**
 * Registers the service worker and manages app updates.
 *
 * When a new version is deployed, the new worker installs but waits. This
 * component surfaces a small notice so the user can apply it in one tap — no
 * cache clearing, no reinstall, and no risk to their files (files live in
 * Supabase, never in the browser).
 *
 * If the user ignores the notice, the update still applies automatically the
 * next time the app is fully closed and reopened.
 */
export function PwaRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);

  const waitingWorker = useRef<ServiceWorker | null>(null);
  const reloading = useRef(false);

  const applyUpdate = useCallback(() => {
    const worker = waitingWorker.current;
    if (!worker) {
      window.location.reload();
      return;
    }
    setApplying(true);
    worker.postMessage("SKIP_WAITING");
    // Safety net in case controllerchange never fires.
    window.setTimeout(() => {
      if (!reloading.current) window.location.reload();
    }, 3000);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let intervalId: number | null = null;
    let disposed = false;

    const onControllerChange = () => {
      if (reloading.current) return;
      reloading.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const showNotice = (worker: ServiceWorker | null) => {
      if (!worker) return;
      waitingWorker.current = worker;
      setUpdateReady(true);
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (disposed) return;

        // A newer worker may already be waiting from a previous visit.
        if (registration.waiting && navigator.serviceWorker.controller) {
          showNotice(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showNotice(installing);
            }
          });
        });

        intervalId = window.setInterval(() => {
          registration.update().catch(() => undefined);
        }, CHECK_INTERVAL_MS);
      } catch {
        // PWA support is an enhancement; ignore failures.
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });

    // Re-check when the user returns to the app.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update().catch(() => undefined))
        .catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disposed = true;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  if (!updateReady || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 z-[70] animate-pop top-[calc(env(safe-area-inset-top)+4.75rem)] sm:inset-x-auto sm:right-6 sm:top-24 sm:w-[340px]"
    >
      <div className="flex items-start gap-2.5 rounded-2xl border-2 border-primary/30 bg-surface/95 p-3 shadow-float backdrop-blur-xl">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary-deep dark:text-primary-soft">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-ink">
            A newer LumiNest is ready
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
            Refresh to get it. Your files stay safe in your nest.
          </p>
          <button
            type="button"
            onClick={applyUpdate}
            disabled={applying}
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full border-2 border-[#6d5b90]/30 bg-primary px-3 text-[11px] font-bold text-[#3d3153] transition hover:bg-primary-deep hover:text-white disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3 w-3 ${applying ? "animate-spin" : ""}`}
            />
            {applying ? "Updating…" : "Update now"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
