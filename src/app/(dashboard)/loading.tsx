import { Skeleton } from "@/components/ui/Skeleton";

/** Fallback loading UI for every dashboard route that lacks its own loader. */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading your nest…</span>

      <div className="rounded-[30px] border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-blush/20 to-softBlue/25 p-5 shadow-toony sm:p-7">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-64 max-w-full" />
            <Skeleton className="h-3 w-80 max-w-full" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>
          <Skeleton className="hidden h-32 w-32 rounded-full sm:block" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border-2 border-line bg-surface/70 px-3.5 py-3"
          >
            <Skeleton className="h-6 w-12" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[28px] border-2 border-line bg-surface/90"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-3.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
