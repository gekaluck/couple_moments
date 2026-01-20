"use client";

import { useEffect, useState } from "react";

import Modal from "@/components/Modal";

type CalendarAddControlsProps = {
  onCreateEvent: (formData: FormData) => Promise<void>;
  onCreateBlock: (formData: FormData) => Promise<void>;
  initialEventDate?: string | null;
};

export default function CalendarAddControls({
  onCreateEvent,
  onCreateBlock,
  initialEventDate,
}: CalendarAddControlsProps) {
  const [openPanel, setOpenPanel] = useState<"event" | "block" | null>(null);
  const [eventDate, setEventDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialEventDate) {
      setEventDate(initialEventDate);
      setOpenPanel("event");
    }
  }, [initialEventDate]);

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="button-hover inline-flex items-center gap-2 rounded-full border border-[var(--color-border-hover)] px-4 py-2 text-xs font-semibold text-[var(--color-primary)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-primary-hover)]"
          onClick={() => {
            setEventDate(undefined);
            setOpenPanel("event");
          }}
          type="button"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          + Event
        </button>
        <button
          className="button-hover inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
          onClick={() => setOpenPanel("block")}
          type="button"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 22a10 10 0 1 0-9.95-11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          + Unavailable
        </button>
      </div>
      <Modal
        isOpen={openPanel === "event"}
        onClose={() => setOpenPanel(null)}
        title="New event"
      >
        <form className="grid gap-3" action={onCreateEvent}>
          <input
            className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="title"
            placeholder="Dinner at Aurora"
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="date"
              type="date"
              defaultValue={eventDate}
              required
            />
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="time"
              type="time"
            />
          </div>
          <input
            className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="tags"
            placeholder="tags (comma separated)"
          />
          <textarea
            className="min-h-[100px] rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="description"
            placeholder="Notes or details"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="button-hover rounded-xl border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
              onClick={() => setOpenPanel(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="button-hover rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
              type="submit"
            >
              Save event
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={openPanel === "block"}
        onClose={() => setOpenPanel(null)}
        title="Block out unavailable time"
      >
        <form className="grid gap-3" action={onCreateBlock}>
          <input
            className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="title"
            placeholder="Out of town"
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="start"
              type="date"
              required
            />
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="end"
              type="date"
              required
            />
          </div>
          <input
            className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="note"
            placeholder="Optional note"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="button-hover rounded-xl border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
              onClick={() => setOpenPanel(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="button-hover rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
              type="submit"
            >
              Add block
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
