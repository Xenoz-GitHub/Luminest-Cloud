"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { LegalSections } from "@/components/legal/LegalSections";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  TERMS_INTRO,
  TERMS_SECTIONS,
} from "@/lib/legal-content";
import { APP_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type TabId = "privacy" | "terms";

const TABS: { id: TabId; label: string; icon: typeof ShieldCheck }[] = [
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
  { id: "terms", label: "Terms", icon: FileText },
];

export function LegalTabs() {
  const [active, setActive] = useState<TabId>("privacy");
  const baseId = useId();
  const reduceMotion = useReducedMotion();

  const isPrivacy = active === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const intro = isPrivacy ? PRIVACY_INTRO : TERMS_INTRO;
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const publicHref = isPrivacy ? "/privacy" : "/terms";

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setActive((current) => (current === "privacy" ? "terms" : "privacy"));
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Legal documents"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 gap-1.5 rounded-2xl border-2 border-line bg-surface2/70 p-1.5 sm:inline-grid sm:w-auto"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(id)}
              className={cn(
                "relative flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition sm:px-5 sm:text-sm",
                selected
                  ? "text-ink"
                  : "text-muted hover:text-ink"
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${baseId}-pill`}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 400, damping: 34 }
                  }
                  className="absolute inset-0 rounded-xl bg-surface shadow-sm ring-1 ring-line"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
        className="mt-4"
      >
        <motion.div
          key={active}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
        >
          <div className="rounded-[24px] border-2 border-primary/20 bg-primary/5 p-4 sm:p-5">
            <h2 className="text-lg font-extrabold tracking-tight text-ink">
              {title}
            </h2>
            <p className="mt-1 text-[11px] font-semibold text-muted">
              Last updated {LEGAL_UPDATED}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
              {intro}
            </p>
          </div>

          <LegalSections sections={sections} className="mt-3" />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border-2 border-line bg-surface/85 p-4 shadow-toony-sm">
              <h3 className="text-sm font-bold text-ink">Questions?</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Email us at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-semibold text-primary-deep underline-offset-4 hover:underline dark:text-primary-soft"
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                and we will help.
              </p>
            </div>
            <div className="rounded-[24px] border-2 border-line bg-surface/85 p-4 shadow-toony-sm">
              <h3 className="text-sm font-bold text-ink">Shareable version</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                A standalone page you can link to from outside the app.
              </p>
              <Link
                href={publicHref}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary-deep hover:underline dark:text-primary-soft"
              >
                Open the public {isPrivacy ? "Privacy Policy" : "Terms"}{" "}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] text-muted">
            {APP_NAME} · {title} · Last updated {LEGAL_UPDATED}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
