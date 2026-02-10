import { SkeletonActivityItem } from "@/components/ui/Skeleton";

export default function ActivityLoading() {
  return (
    <>
      <section className="surface-muted p-6">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton mt-2 h-4 w-64" />
        <div className="mt-3 flex gap-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-28 rounded-full" />
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="skeleton h-4 w-16" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonActivityItem key={`today-${i}`} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div className="skeleton h-4 w-20" />
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonActivityItem key={`yesterday-${i}`} />
          ))}
        </div>
      </section>
    </>
  );
}
