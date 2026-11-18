"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  ACCENTS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  applyAccent,
  isAccentId,
} from "@/lib/accent";
import { cn } from "@/lib/utils";

export function AccentPicker({
  initial,
  onChange,
}: {
  initial?: string | null;
  onChange?: (id: string) => void;
}) {
  const [active, setActive] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
      if (isAccentId(stored)) setActive(stored);
      else if (isAccentId(initial ?? undefined)) setActive(initial as string);
    } catch {
      // ignore
    }
  }, [initial]);

  function choose(id: string) {
    setActive(id);
    applyAccent(id);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, id);
    } catch {
      // ignore
    }
    onChange?.(id);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Accent color"
      className="grid grid-cols-4 gap-2 sm:grid-cols-8"
    >
      {ACCENTS.map((accent) => {
        const selected = active === accent.id;
        return (
          <button
            key={accent.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={accent.label}
            title={accent.label}
            onClick={() => choose(accent.id)}
            className={cn(
              "group flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition",
              selected
                ? "border-primary bg-primary/10"
                : "border-line bg-surface hover:border-primary/40 hover:bg-surface2"
            )}
          >
            <span
              className="relative grid h-8 w-8 place-items-center rounded-full ring-1 ring-black/5"
              style={{ backgroundColor: accent.swatch }}
            >
              {selected && (
                <Check
                  className="h-4 w-4 text-white drop-shadow"
                  strokeWidth={3}
                  aria-hidden
                />
              )}
            </span>
            <span className="text-[10px] font-semibold text-muted">
              {accent.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
