"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/** Read-only star display for review lists and aggregates. */
export function StarDisplay({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const rounded = Math.round(value);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            px,
            star <= rounded
              ? "fill-[#E8BE6A] text-[#E8BE6A]"
              : "fill-transparent text-line"
          )}
          strokeWidth={2}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** Interactive star input used by the review form. */
export function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Rating"
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"} — ${LABELS[star]}`}
            disabled={disabled}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(star)}
            className="rounded-md p-0.5 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Star
              className={cn(
                "h-7 w-7 transition",
                star <= shown
                  ? "fill-[#E8BE6A] text-[#E8BE6A]"
                  : "fill-transparent text-line"
              )}
              strokeWidth={1.8}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <p className="mt-1 h-4 text-[11px] font-semibold text-muted">
        {shown ? LABELS[shown] : "Tap a star to rate"}
      </p>
    </div>
  );
}
