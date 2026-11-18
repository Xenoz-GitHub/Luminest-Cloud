import { Mascot, type MascotState } from "@/components/mascot/Mascot";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  state?: MascotState;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  state = "empty-library",
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-primary/35 bg-surface/60 px-6 text-center",
        compact ? "py-8" : "py-12 sm:py-16",
        className
      )}
    >
      <Mascot
        state={state}
        size={compact ? 120 : 170}
        animation="float"
        glow
        className="mb-3"
      />
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
