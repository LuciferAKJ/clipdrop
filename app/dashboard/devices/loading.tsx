import { Skeleton } from "@/components/ui/skeleton";

export default function DevicesLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="space-y-4 border-b border-border/80 pb-6">
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-3.5 w-80 rounded-lg" />
        </div>
      </div>

      {/* Devices List Skeleton */}
      <div className="space-y-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-24 w-full rounded-2xl border border-border/40"
          />
        ))}
      </div>
    </main>
  );
}
