"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConfig = /supabase is not configured/i.test(error.message);

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-surface/90 p-8 text-center shadow-float">
        <Mascot expression="confused" size={150} glow className="mx-auto" />
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          {isConfig ? "Lumi needs her keys" : "Something fluffed up"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isConfig
            ? "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the app."
            : "The page hit an unexpected snag. Your files are safe — nothing was lost."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Link
            href="/home"
            className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-ink transition hover:bg-surface2"
          >
            Back to my nest
          </Link>
        </div>
      </div>
    </div>
  );
}
