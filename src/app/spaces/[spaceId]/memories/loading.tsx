import { SkeletonEventCard } from "@/components/ui/Skeleton";

export default function MemoriesLoading() {
  return (
    <>
      <section className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="skeleton h-6 w-40" />
            <div className="skeleton mt-2 h-4 w-64" />
          </div>
          <div className="flex gap-2">
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
