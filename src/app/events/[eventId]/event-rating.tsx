"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import HeartRating from "@/components/ui/HeartRating";

type EventRatingProps = {
  eventId: string;
  currentRating: number | null;
  onRate: (formData: FormData) => Promise<void>;
};

export default function EventRating({
  eventId,
  currentRating,
  onRate,
}: EventRatingProps) {
  const [isPending, startTransition] = useTransition();

  function handleRatingChange(rating: number) {
    const formData = new FormData();
    formData.set("eventId", eventId);
    formData.set("rating", rating.toString());

    startTransition(async () => {
      try {
        await onRate(formData);
        toast.success("Rating saved!");
      } catch {
        toast.error("Failed to save rating");
      }
    });
  }

  return (
    <div className="mt-5 rounded-2xl border border-[var(--panel-border)] bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            How was this date?
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Rate this memory to help find your favorites later
          </p>
        </div>
        <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
          <HeartRating
            value={currentRating}
            onChange={handleRatingChange}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}
