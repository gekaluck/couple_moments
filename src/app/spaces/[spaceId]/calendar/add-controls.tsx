"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import Modal from "@/components/Modal";
import PlaceHiddenInputs from "@/components/places/PlaceHiddenInputs";
import PlaceSearch, { PlaceSelection } from "@/components/places/PlaceSearch";

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
  onCreateEvent: (formData: FormData) => Promise<
    | void
    | {
        googleSync?: {
          attempted: boolean;
          success: boolean;
          message?: string;
          info?: string;
        };
      }
  >;
  onCreateBlock: (formData: FormData) => Promise<void>;
  initialEventDate?: string | null;
  prefillData?: PrefillData | null;
  hasGoogleCalendar?: boolean;
  mapsApiKey?: string;
};

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarAddControls({
  onCreateEvent,
  onCreateBlock,
  initialEventDate,
  prefillData,
  hasGoogleCalendar = false,
  mapsApiKey,
}: CalendarAddControlsProps) {
  const [openPanel, setOpenPanel] = useState<"event" | "block" | null>(() =>
    initialEventDate || prefillData ? "event" : null,
  );
  const [eventDate, setEventDate] = useState<string | undefined>(() => initialEventDate ?? undefined);
  const todayStr = getTodayDateString();
  const [errors, setErrors] = useState<{
    eventTitle?: string;
    eventDate?: string;
    blockTitle?: string;
    blockDate?: string;
  }>({});
  const [isPending, startTransition] = useTransition();
  const [place, setPlace] = useState<PlaceSelection | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeEventDate = initialEventDate ?? eventDate;
  const activePlaceId = place?.placeId ?? prefillData?.placeId ?? "";
  const activePlaceName = place?.name ?? prefillData?.placeName ?? "";
  const activePlaceAddress = place?.address ?? prefillData?.placeAddress ?? "";
  const activePlaceWebsite = place?.website ?? prefillData?.placeWebsite ?? "";
  const activePlaceOpeningHours =
    place?.openingHours ?? prefillData?.placeOpeningHours ?? null;
  const activePlacePhotoUrls = place?.photoUrls ?? prefillData?.placePhotoUrls ?? null;
  const activePlaceLat = place?.lat ?? prefillData?.placeLat ?? null;
  const activePlaceLng = place?.lng ?? prefillData?.placeLng ?? null;
  const activePlaceUrl = place?.url ?? prefillData?.placeUrl ?? "";

  const clearModalParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["new", "repeat", "action", "editBlock"].forEach((key) => params.delete(key));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const closePanel = () => {
    setOpenPanel(null);
    setErrors({});
  };

  const modalTitle = prefillData ? "Do this again" : "New event";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/90 px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-medium)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/35"
          aria-label="Create a new event"
          onClick={() => {
            setEventDate(undefined);
            setErrors({});
            setOpenPanel("event");
            setErrors({});
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
          onClick={() => {
            setErrors({});
            setOpenPanel("block");
          }}
          type="button"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 22a10 10 0 1 0-9.95-11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Block time
        </button>
      </div>
      <Modal
        isOpen={openPanel === "event"}
        onClose={closePanel}
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
                const result = await onCreateEvent(formData);
                toast.success(prefillData ? "Event created!" : "Event saved!");
                if (result?.googleSync?.attempted && !result.googleSync.success) {
                  toast.warning(
                    result.googleSync.message ??
                      "Saved in Duet, but Google Calendar sync failed.",
                  );
                } else if (result?.googleSync?.info) {
                  toast.info(result.googleSync.info);
                }
                closePanel();
                clearModalParams();
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
            className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
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
              className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              name="date"
              type="date"
              defaultValue={activeEventDate}
              min={todayStr}
              required
            />
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
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
            className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
            name="tags"
            placeholder="tags (comma separated)"
            defaultValue={prefillData?.tags ?? ""}
          />
          <PlaceSearch
            label="Place"
            placeholder="Search a place"
            apiKey={mapsApiKey}
            initialValue={activePlaceName}
            onSelect={(selection) => setPlace(selection)}
          />
          <PlaceHiddenInputs
            placeId={activePlaceId}
            placeName={activePlaceName}
            placeAddress={activePlaceAddress}
            placeWebsite={activePlaceWebsite}
            placeOpeningHours={activePlaceOpeningHours}
            placePhotoUrls={activePlacePhotoUrls}
            placeLat={activePlaceLat}
            placeLng={activePlaceLng}
            placeUrl={activePlaceUrl}
          />
          <textarea
            className="min-h-[100px] rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
            name="description"
            placeholder="Notes or details"
            defaultValue={prefillData?.description ?? ""}
          />
          {hasGoogleCalendar && (
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                name="addToGoogleCalendar"
                value="true"
                defaultChecked
                className="h-4 w-4 rounded border-[var(--panel-border)] text-rose-500 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M19.5 3.75H4.5C3.67 3.75 3 4.42 3 5.25V18.75C3 19.58 3.67 20.25 4.5 20.25H19.5C20.33 20.25 21 19.58 21 18.75V5.25C21 4.42 20.33 3.75 19.5 3.75Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 9.75H21" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8.25 6V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M15.75 6V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add to Google Calendar
              </span>
            </label>
          )}
          {activePlaceName ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <span className="font-semibold">Place:</span> {activePlaceName}
              {activePlaceAddress ? <span className="text-emerald-600"> - {activePlaceAddress}</span> : null}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="button-hover rounded-xl border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
              onClick={closePanel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="button-hover rounded-full bg-[var(--action-primary)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:bg-[var(--action-primary-strong)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/40"
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
        onClose={closePanel}
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
                closePanel();
                clearModalParams();
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
            className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
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
              className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              name="start"
              type="date"
              required
            />
            <input
              aria-describedby={errors.blockDate ? "block-date-error" : undefined}
              aria-invalid={errors.blockDate ? "true" : "false"}
              className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
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
            className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
            name="note"
            placeholder="Optional note"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="button-hover rounded-xl border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
              onClick={closePanel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="button-hover rounded-full bg-[var(--action-primary)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:bg-[var(--action-primary-strong)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/40"
              type="submit"
              disabled={isPending}
            >
              Add block
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

