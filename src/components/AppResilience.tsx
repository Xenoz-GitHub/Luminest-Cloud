"use client";

import { useEffect } from "react";

/**
 * Self-healing for the one failure mode a user cannot recover from on their
 * own: the page loads but a JS chunk 404s (usually after a deploy), so React
 * never hydrates and the screen stays blank.
 *
 * When that happens we clear the service worker and all caches, then reload
 * once. This is the automatic equivalent of "clear cache and hard reload",
 * which is exactly what we do not want to ask users to do.
 */

const CHUNK_ERROR = /ChunkLoadError|Loading chunk \d+ failed|Loading CSS chunk|Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i;

const RECOVERY_KEY = "luminest-chunk-recovery";

export function AppResilience() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // React is running: hide the static no-JS boot fallback.
    document.documentElement.classList.add("app-ready");

    let recovering = false;

    const recover = async (reason: string) => {
      if (recovering) return;
      recovering = true;

      // Only auto-recover once per session, so a genuinely broken deploy cannot
      // trap the user in a reload loop.
      try {
        const last = Number(sessionStorage.getItem(RECOVERY_KEY) ?? "0");
        if (Date.now() - last < 30_000) {
          console.error("[resilience] chunk error after recent recovery:", reason);
          return;
        }
        sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
      } catch {
        // Private mode: still attempt the recovery.
      }

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        // Best effort: reload regardless.
      }

      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      const text = `${event.message ?? ""} ${(event.error as Error | null)?.name ?? ""}`;
      if (CHUNK_ERROR.test(text)) void recover(text);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const text =
        typeof reason === "string"
          ? reason
          : `${reason?.name ?? ""} ${reason?.message ?? ""}`;
      if (CHUNK_ERROR.test(text)) void recover(text);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
