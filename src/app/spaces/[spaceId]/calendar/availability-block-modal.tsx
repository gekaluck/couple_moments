"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";

type AvailabilityBlockModalProps = {
  isOpen: boolean;
  onCloseHref: string;
  onSubmit: (formData: FormData) => Promise<void>;
  onDelete: (blockId: string) => Promise<void>;
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
  onDelete,
  block,
}: AvailabilityBlockModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
          const start = formData.get("start")?.toString() ?? "";
          const end = formData.get("end")?.toString() ?? "";
          if (
            start &&
            end &&
            new Date(`${start}T00:00:00`) > new Date(`${end}T23:59:59`)
          ) {
            toast.error("Start date cannot be after end date.");
            return;
          }
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
          className="rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
          name="title"
          defaultValue={block.title}
          required
        />
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
            name="start"
            type="date"
            defaultValue={block.startDate}
            required
          />
          <input
            className="rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
            name="end"
            type="date"
            defaultValue={block.endDate}
            required
          />
        </div>
        <input
          className="rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
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
      <div className="mt-6 rounded-2xl border border-[#e6c9c4] bg-[#f9e5e2] p-4">
        <h3 className="text-sm font-semibold text-[#a1493d]">Danger zone</h3>
        <p className="mt-2 text-sm text-[#a1493d]">
          Deleting removes this unavailable block from your shared calendar.
        </p>
        <button
          className="mt-4 rounded-full border border-[#a1493d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a1493d] transition hover:bg-[#f2d6d1]"
          type="button"
          onClick={() => setIsDeleteOpen(true)}
        >
          Delete block
        </button>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await onDelete(block.id);
            toast.success("Unavailable time deleted.");
            router.push(onCloseHref);
            router.refresh();
          } catch {
            toast.error("Failed to delete unavailable time");
          }
        }}
        title="Delete unavailable time"
        message="Are you sure you want to delete this unavailable time block?"
        confirmLabel="Delete"
        variant="danger"
      />
    </Modal>
  );
}
