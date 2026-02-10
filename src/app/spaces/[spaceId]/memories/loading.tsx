import { SkeletonEventCard } from "@/components/ui/Skeleton";

export default function MemoriesLoading() {
  return (
    <>
      <section className="surface-muted p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="skeleton h-6 w-40" />
            <div className="skeleton mt-2 h-4 w-64" />
            <div className="mt-3 flex gap-2">
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-6 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid gap-2 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-2 md:grid-cols-3">
            <div className="skeleton h-9 w-full rounded-full" />
            <div className="skeleton h-9 w-24 rounded-full" />
            <div className="skeleton h-9 w-28 rounded-full" />
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonEventCard key={i} />
        ))}
      </section>
    </>
  );
}
