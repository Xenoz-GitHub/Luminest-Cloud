"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Small, non-blocking banner shown while the device is offline. It tells the
 * user exactly what still works (on-device summaries) and what does not
 * (uploads, sharing) so nothing appears to hang silently.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-start gap-2.5 rounded-2xl border-2 border-[#F3C677]/50 bg-[#FFF0D8]/70 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-[#7d5a17] dark:border-[#F3C677]/30 dark:bg-[#443720]/50 dark:text-[#ffdc95]"
    >
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <strong className="font-bold">You’re offline.</strong> Pages you already
        visited stay available, and Lumi can summarize saved documents on your
        device. Uploading, sharing and syncing need a connection.
      </span>
    </div>
  );
}
