import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-surface/90 p-8 text-center shadow-float">
        <Mascot state="file-not-found" size={160} glow className="mx-auto" />
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
          404 · a tiny wrong turn
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink">
          This page hopped away
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The page or file you’re looking for isn’t here. It may have been moved,
          deleted, or the link may be mistyped.
        </p>
        <Link
          href="/home"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          Back to my nest
        </Link>
      </div>
    </div>
  );
}
