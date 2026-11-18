import { cn } from "@/lib/utils";
import type { LegalSection } from "@/lib/legal-content";

/**
 * Renders the numbered legal cards. Shared by the public pages and the in-app
 * legal view so both look identical and stay in sync.
 */
export function LegalSections({
  sections,
  className,
}: {
  sections: LegalSection[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {sections.map((section, index) => (
        <section
          key={section.heading}
          className="rounded-[24px] border-2 border-line bg-surface/85 p-4 shadow-toony-sm sm:p-5"
        >
          <h2 className="flex items-baseline gap-2 text-sm font-bold text-ink sm:text-base">
            <span className="shrink-0 text-xs font-extrabold text-primary-deep dark:text-primary-soft">
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.heading}
          </h2>
          <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted sm:text-sm">
            {section.body}
          </div>
        </section>
      ))}
    </div>
  );
}
