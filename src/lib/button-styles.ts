import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "soft";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-primary-deep/30 bg-primary text-primary-ink shadow-toony-primary hover:-translate-y-0.5 hover:bg-primary-deep hover:text-white hover:shadow-toony-primary-lg active:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(var(--accent-deep))] dark:border-white/20",
  secondary:
    "border-[#b9a5ea]/60 bg-secondary/70 text-ink shadow-toony-sm hover:-translate-y-0.5 hover:border-primary hover:bg-secondary active:translate-y-0.5 active:shadow-none dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15",
  ghost:
    "border-transparent bg-transparent text-ink hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/10 active:translate-y-0.5",
  danger:
    "border-[#E892A2]/50 bg-danger/15 text-[#a34b60] shadow-[0_3px_0_0_rgba(232,146,162,0.45)] hover:-translate-y-0.5 hover:border-[#E892A2] hover:bg-danger/25 active:translate-y-0.5 active:shadow-none dark:text-[#f3b3c0]",
  soft:
    "border-line bg-surface text-ink shadow-toony-sm hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface2 active:translate-y-0.5 active:shadow-none",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-11 w-11",
};

/**
 * Shared button classes so links and <button> elements stay visually identical
 * to the Button component without duplicating long class strings on each page.
 */
export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    "inline-flex select-none items-center justify-center rounded-full border-2 font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none",
    VARIANTS[variant],
    SIZES[size],
    className
  );
}
