"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-side hand-off from /launch to the real destination.
 *
 * This exists so the installed app's start_url can always return HTTP 200.
 * A server redirect on start_url is a well-known cause of Android WebAPKs
 * flashing open and closing immediately: the launcher treats the off-URL
 * response as "not my app" and finishes the activity.
 */
export function LaunchRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    // replace() so Back does not return here.
    router.replace(to);
  }, [router, to]);

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/states/welcome.png"
          alt=""
          className="mx-auto h-28 w-28 animate-float object-contain"
        />
        <p className="mt-3 text-sm font-bold text-ink">Opening LumiNest…</p>
      </div>
    </div>
  );
}
