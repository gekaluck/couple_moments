import { SkeletonNoteCard } from "@/components/ui/Skeleton";

export default function NotesLoading() {
  return (
    <>
      <section className="surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="skeleton h-6 w-32" />
            <div className="skeleton mt-2 h-4 w-56" />
          </div>
          <div className="flex gap-2">
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
