import { cn } from "@/lib/utils";

/**
 * A calm shimmering placeholder block. Uses the shared .skeleton utility so
 * loading states match the soft, rounded LumiNest look in both themes.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("skeleton rounded-2xl", className)}
      {...props}
    />
  );
}
