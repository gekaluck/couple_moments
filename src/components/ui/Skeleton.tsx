/**
 * Reusable skeleton loading components
 */

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonText({ className = "" }: SkeletonProps) {
  return <div className={`skeleton h-4 rounded ${className}`} />;
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`surface p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonEventCard() {
  return (
    <div className="surface overflow-hidden border border-rose-200/60 bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(255,238,246,0.78))] p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonIdeaCard() {
  return (
    <div className="surface overflow-hidden border border-amber-200/60 bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(255,246,226,0.78))] p-5">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1 h-3 w-3/4" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

export function SkeletonNoteCard() {
  return (
    <div className="surface border-l-4 border-l-violet-400 bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(243,238,255,0.78))] p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonActivityItem() {
  return (
    <div className="surface bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(235,246,255,0.78))] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}
