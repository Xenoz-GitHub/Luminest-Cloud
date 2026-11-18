import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "danger" | "neutral" | "blue";

const TONES: Record<Tone, string> = {
  primary:
    "bg-primary/15 text-primary-deep ring-primary/25 dark:text-primary-soft",
  success:
    "bg-[#7FC8A9]/20 text-[#2f7a5c] ring-[#7FC8A9]/30 dark:text-[#a7e6cb]",
  warning:
    "bg-[#F3C677]/25 text-[#8a6414] ring-[#F3C677]/35 dark:text-[#ffe0a3]",
  danger:
    "bg-[#E892A2]/20 text-[#a34b60] ring-[#E892A2]/30 dark:text-[#f3b3c0]",
  neutral: "bg-surface2 text-muted ring-line",
  blue: "bg-[#DCEBFA] text-[#356b96] ring-[#DCEBFA] dark:bg-[#DCEBFA]/15 dark:text-[#b7d9f7]",
};

export function Badge({
  tone = "primary",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
