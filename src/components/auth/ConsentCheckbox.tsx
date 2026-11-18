"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConsentCheckbox({
  checked,
  onChange,
  id = "consent",
  invalid = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id?: string;
  invalid?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-2xl border-2 px-3.5 py-3 text-xs leading-relaxed transition",
        invalid
          ? "animate-shake border-[#E892A2]/70 bg-[#E892A2]/10 ring-4 ring-[#E892A2]/15"
          : "border-line bg-surface2/40 hover:border-primary/30"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[rgb(var(--accent-deep))]"
        aria-required="true"
      />
      <span className={cn("text-muted", invalid && "text-[#a34b60] dark:text-[#f3b3c0]")}>
        {invalid && (
          <span className="mb-1 flex items-center gap-1 font-semibold">
            <AlertCircle className="h-3.5 w-3.5" /> Please tick this box first
          </span>
        )}
        I agree to the{" "}
        <Link
          href="/terms"
          target="_blank"
          className="font-semibold text-primary-deep underline-offset-4 hover:underline dark:text-primary-soft"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          className="font-semibold text-primary-deep underline-offset-4 hover:underline dark:text-primary-soft"
        >
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
