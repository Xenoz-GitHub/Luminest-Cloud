import Link from "next/link";
import { CloudOff } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-surface/90 p-8 text-center shadow-float">
        <Mascot expression="sleepy" size={160} glow className="mx-auto" />
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-deep dark:text-primary-soft">
          <CloudOff className="h-3.5 w-3.5" /> No connection
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          Lumi is napping offline
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The app still opens and you can summarize documents whose text is
          already saved — Lumi does that on your device. Uploads, downloads and
          sharing links need a connection. Nothing is silently queued.
        </p>
        <Link
          href="/home"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
