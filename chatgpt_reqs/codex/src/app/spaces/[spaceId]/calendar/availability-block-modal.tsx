"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/Modal";

type AvailabilityBlockModalProps = {
  isOpen: boolean;
  onCloseHref: string;
  onSubmit: (formData: FormData) => Promise<void>;
  block: {
    id: string;
    title: string;
    note: string | null;
    startDate: string;
    endDate: string;
  } | null;
};

export default function AvailabilityBlockModal({
  isOpen,
  onCloseHref,
  onSubmit,
  block,
}: AvailabilityBlockModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!block) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => router.push(onCloseHref)}
      title="Edit unavailable time"
    >
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            try {
              await onSubmit(formData);
              toast.success("Availability updated!");
              router.push(onCloseHref);
              router.refresh();
            } catch {
              toast.error("Failed to update availability");
            }
          });
        }}
      >
        <input type="hidden" name="blockId" value={block.id} />
        <input
          className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          name="title"
          defaultValue={block.title}
          required
        />
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="start"
            type="date"
            defaultValue={block.startDate}
            required
          />
          <input
            className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="end"
            type="date"
            defaultValue={block.endDate}
            required
          />
        </div>
        <input
          className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          name="note"
          defaultValue={block.note ?? ""}
          placeholder="Optional note"
        />
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className="rounded-xl border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
            onClick={() => router.push(onCloseHref)}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-50"
            type="submit"
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
