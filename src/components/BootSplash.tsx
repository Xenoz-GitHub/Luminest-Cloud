"use client";

import { useEffect } from "react";

/**
 * Shows the animated splash while the installed app boots, then fades it out.
 *
 * The splash markup lives in layout.tsx and is only visible when the document
 * has the .pwa-standalone class (set by an inline script before first paint),
 * so people visiting in a normal browser never see it.
 */
export function BootSplash() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("pwa-standalone")) return;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      root.classList.add("boot-splash-done");
    };

    // Hide once the app is interactive, with a sensible minimum so the
    // animation does not flash on fast devices.
    const minDelay = window.setTimeout(finish, 1100);
    const maxDelay = window.setTimeout(finish, 4000);

    // Hard safety net: if this component ever fails to run its timers (for
    // example a hydration error on a cold start), remove the splash anyway so
    // the app is never permanently covered by an opaque overlay.
    const hardStop = window.setTimeout(() => {
      document.getElementById("boot-splash")?.remove();
      root.classList.add("boot-splash-done");
    }, 6000);

    return () => {
      window.clearTimeout(minDelay);
      window.clearTimeout(maxDelay);
      window.clearTimeout(hardStop);
    };
  }, []);

  return null;
}
