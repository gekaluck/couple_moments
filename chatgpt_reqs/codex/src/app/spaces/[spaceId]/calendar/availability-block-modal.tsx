"use client";

import { useRouter } from "next/navigation";

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

  if (!block) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => router.push(onCloseHref)}
      title="Edit unavailable time"
    >
      <form className="grid gap-3" action={onSubmit}>
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
            className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
            type="submit"
          >
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
