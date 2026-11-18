import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LegalTabs } from "./LegalTabs";

export const metadata: Metadata = { title: "Legal" };
export const dynamic = "force-dynamic";

export default function LegalPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
          <ShieldCheck className="h-3.5 w-3.5" /> The fine print
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Privacy &amp; Terms
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Everything LumiNest does with your data, and the rules for using your
          nest — in one calm place, always available from inside the app.
        </p>
      </div>

      <LegalTabs />
    </div>
  );
}
