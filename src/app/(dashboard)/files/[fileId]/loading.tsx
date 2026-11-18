import { Skeleton } from "@/components/ui/Skeleton";

/** Mirrors the file detail layout so the swap-in feels calm. */
export default function FileDetailLoading() {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <span className="sr-only">Loading file…</span>

      <Skeleton className="h-3 w-28" />

      <div className="flex items-start gap-3">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-52 max-w-full" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="h-72 w-full rounded-[28px]" />
          <Skeleton className="h-48 w-full rounded-[28px]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-[28px]" />
          <Skeleton className="h-40 w-full rounded-[28px]" />
          <Skeleton className="h-28 w-full rounded-[28px]" />
        </div>
      </div>
    </div>
  );
}
