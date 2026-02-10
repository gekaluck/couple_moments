import { SkeletonNoteCard } from "@/components/ui/Skeleton";

export default function NotesLoading() {
  return (
    <>
      <section className="surface-muted p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="skeleton h-6 w-32" />
            <div className="skeleton mt-2 h-4 w-56" />
            <div className="mt-3 flex gap-2">
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-6 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid gap-2 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-2 md:grid-cols-3">
            <div className="skeleton h-10 w-full rounded-full" />
            <div className="skeleton h-10 w-32 rounded-full" />
            <div className="skeleton h-10 w-48 rounded-full" />
            <div className="skeleton h-10 w-20 rounded-full" />
          </div>
        </div>
        <div className="mt-6">
          <div className="skeleton h-40 w-full rounded-2xl" />
        </div>
        <div className="mt-3 flex justify-end">
          <div className="skeleton h-10 w-28 rounded-full" />
        </div>
      </section>
      <section className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonNoteCard key={i} />
        ))}
      </section>
    </>
  );
}
