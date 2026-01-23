"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Modal from "@/components/Modal";

type PrefillData = {
  title: string;
  description: string;
  tags: string;
  placeId: string | null;
  placeName: string | null;
  placeAddress: string | null;
  placeLat: number | null;
  placeLng: number | null;
  placeUrl: string | null;
  placeWebsite: string | null;
  placeOpeningHours: string[] | null;
  placePhotoUrls: string[] | null;
};

type CalendarAddControlsProps = {
  onCreateEvent: (formData: FormData) => Promise<void>;
  onCreateBlock: (formData: FormData) => Promise<void>;
  initialEventDate?: string | null;
  prefillData?: PrefillData | null;
};

export default function CalendarAddControls({
  onCreateEvent,
  onCreateBlock,
  initialEventDate,
  prefillData,
}: CalendarAddControlsProps) {
  const [openPanel, setOpenPanel] = useState<"event" | "block" | null>(null);
  const [eventDate, setEventDate] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{
    eventTitle?: string;
    eventDate?: string;
    blockTitle?: string;
    blockDate?: string;
  }>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (initialEventDate) {
      setEventDate(initialEventDate);
      setOpenPanel("event");
    } else if (prefillData) {
      // Open modal for "repeat event" flow
      setOpenPanel("event");
    } else {
      // Close modal when URL param is removed (after form submission redirect)
      setOpenPanel(null);
    }
  }, [initialEventDate, prefillData]);

  useEffect(() => {
    if (!openPanel) {
      setErrors({});
    }
  }, [openPanel]);

  const modalTitle = prefillData ? "Do this again" : "New event";

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
        title={modalTitle}
      >
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const title = formData.get("title")?.toString().trim() ?? "";
            const date = formData.get("date")?.toString().trim() ?? "";
            if (!title || !date) {
              setErrors({
                eventTitle: title ? undefined : "Please add a title.",
                eventDate: date ? undefined : "Please choose a date.",
              });
              return;
            }
            setErrors((prev) => ({
              ...prev,
              eventTitle: undefined,
              eventDate: undefined,
            }));
            startTransition(async () => {
              try {
                await onCreateEvent(formData);
                toast.success(prefillData ? "Event created!" : "Event saved!");
                setOpenPanel(null);
                router.refresh();
              } catch {
                toast.error("Failed to save event");
              }
            });
          }}
        >
          {prefillData && (
            <p className="text-sm text-[var(--text-muted)] mb-2">
              Re-creating event from a previous date. Pick a new date below.
            </p>
          )}
          <input
            aria-describedby={errors.eventTitle ? "event-title-error" : undefined}
            aria-invalid={errors.eventTitle ? "true" : "false"}
            className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="title"
            placeholder="Dinner at Aurora"
            defaultValue={prefillData?.title ?? ""}
            required
          />
          {errors.eventTitle ? (
            <p className="text-xs text-[var(--status-warning-text)]" id="event-title-error">
              {errors.eventTitle}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <input
              aria-describedby={errors.eventDate ? "event-date-error" : undefined}
              aria-invalid={errors.eventDate ? "true" : "false"}
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
          {errors.eventDate ? (
            <p className="text-xs text-[var(--status-warning-text)]" id="event-date-error">
              {errors.eventDate}
            </p>
          ) : null}
          <input
            className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="tags"
            placeholder="tags (comma separated)"
            defaultValue={prefillData?.tags ?? ""}
          />
          <textarea
            className="min-h-[100px] rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="description"
            placeholder="Notes or details"
            defaultValue={prefillData?.description ?? ""}
          />
          {/* Hidden fields for place data when repeating */}
          {prefillData?.placeId && (
            <>
              <input type="hidden" name="placeId" value={prefillData.placeId} />
              <input type="hidden" name="placeName" value={prefillData.placeName ?? ""} />
              <input type="hidden" name="placeAddress" value={prefillData.placeAddress ?? ""} />
              {prefillData.placeLat && <input type="hidden" name="placeLat" value={prefillData.placeLat} />}
              {prefillData.placeLng && <input type="hidden" name="placeLng" value={prefillData.placeLng} />}
              {prefillData.placeUrl && <input type="hidden" name="placeUrl" value={prefillData.placeUrl} />}
              {prefillData.placeWebsite && <input type="hidden" name="placeWebsite" value={prefillData.placeWebsite} />}
              {prefillData.placeOpeningHours && (
                <input type="hidden" name="placeOpeningHours" value={JSON.stringify(prefillData.placeOpeningHours)} />
              )}
              {prefillData.placePhotoUrls && (
                <input type="hidden" name="placePhotoUrls" value={JSON.stringify(prefillData.placePhotoUrls)} />
              )}
            </>
          )}
          {prefillData?.placeName && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <span className="font-semibold">Place:</span> {prefillData.placeName}
              {prefillData.placeAddress && <span className="text-emerald-600"> — {prefillData.placeAddress}</span>}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="button-hover rounded-xl border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
              onClick={() => setOpenPanel(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="button-hover rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-50"
              type="submit"
              disabled={isPending}
            >
              {prefillData ? "Create event" : "Save event"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={openPanel === "block"}
        onClose={() => setOpenPanel(null)}
        title="Block out unavailable time"
      >
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const title = formData.get("title")?.toString().trim() ?? "";
            const start = formData.get("start")?.toString().trim() ?? "";
            const end = formData.get("end")?.toString().trim() ?? "";
            if (!title || !start || !end) {
              setErrors({
                blockTitle: title ? undefined : "Please add a title.",
                blockDate: !start || !end ? "Select a start and end date." : undefined,
              });
              return;
            }
            setErrors((prev) => ({
              ...prev,
              blockTitle: undefined,
              blockDate: undefined,
            }));
            startTransition(async () => {
              try {
                await onCreateBlock(formData);
                toast.success("Availability blocked!");
                setOpenPanel(null);
                router.refresh();
              } catch {
                toast.error("Failed to block time");
              }
            });
          }}
        >
          <input
            aria-describedby={errors.blockTitle ? "block-title-error" : undefined}
            aria-invalid={errors.blockTitle ? "true" : "false"}
            className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="title"
            placeholder="Out of town"
            required
          />
          {errors.blockTitle ? (
            <p className="text-xs text-[var(--status-warning-text)]" id="block-title-error">
              {errors.blockTitle}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <input
              aria-describedby={errors.blockDate ? "block-date-error" : undefined}
              aria-invalid={errors.blockDate ? "true" : "false"}
              className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="start"
              type="date"
              required
            />
            <input
              aria-describedby={errors.blockDate ? "block-date-error" : undefined}
              aria-invalid={errors.blockDate ? "true" : "false"}
              className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="end"
              type="date"
              required
            />
          </div>
          {errors.blockDate ? (
            <p className="text-xs text-[var(--status-warning-text)]" id="block-date-error">
              {errors.blockDate}
            </p>
          ) : null}
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
              className="button-hover rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-50"
              type="submit"
              disabled={isPending}
            >
              Add block
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
