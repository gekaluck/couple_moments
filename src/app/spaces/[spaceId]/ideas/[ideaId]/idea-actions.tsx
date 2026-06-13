"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import PlaceSearch, { PlaceSelection } from "@/components/places/PlaceSearch";
import TagInput from "@/components/ui/TagInput";
import Button from "@/components/ui/Button";
import { getOffsetMinutesForLocalDateTime } from "@/lib/date-time";

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type IdeaDto = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  placeId?: string | null;
  placeName?: string | null;
  placeAddress?: string | null;
  placeLat?: number | null;
  placeLng?: number | null;
  placeUrl?: string | null;
  placeWebsite?: string | null;
  placeOpeningHours?: string[] | null;
  placePhotoUrls?: string[] | null;
};

type ScheduleResult = {
  eventId?: string;
  googleSync?: {
    attempted: boolean;
    success: boolean;
    message?: string;
    info?: string;
  };
};

type IdeaActionsProps = {
  idea: IdeaDto;
  calendarHref: string;
  mapsApiKey?: string;
  hasGoogleCalendar?: boolean;
  onSchedule: (formData: FormData) => Promise<ScheduleResult | void>;
  onEdit: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

export default function IdeaActions({
  idea,
  calendarHref,
  mapsApiKey,
  hasGoogleCalendar = false,
  onSchedule,
  onEdit,
  onDelete,
}: IdeaActionsProps) {
  const router = useRouter();
  const hasMapsKey = Boolean(mapsApiKey);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const todayStr = getTodayDateString();
  const [editPlace, setEditPlace] = useState<PlaceSelection | null>(
    idea.placeId && idea.placeLat != null && idea.placeLng != null && idea.placeUrl
      ? {
          placeId: idea.placeId,
          name: idea.placeName ?? "",
          address: idea.placeAddress ?? "",
          lat: idea.placeLat,
          lng: idea.placeLng,
          url: idea.placeUrl,
          website: idea.placeWebsite ?? undefined,
          openingHours: idea.placeOpeningHours ?? undefined,
          photoUrls: idea.placePhotoUrls ?? undefined,
        }
      : null
  );

  return (
    <>
      <button
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 md:flex-none md:py-2"
        type="button"
        onClick={() => setIsScheduleOpen(true)}
      >
        <Calendar className="h-4 w-4" />
        Schedule
      </button>
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white/90 text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        type="button"
        title="Edit idea"
        aria-label="Edit idea"
        onClick={() => setIsEditOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white/90 text-red-600 shadow-[var(--shadow-sm)] transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        type="button"
        title="Delete idea"
        aria-label="Delete idea"
        onClick={() => setIsDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule this idea"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {idea.title}
            </p>
            {idea.description ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {idea.description}
              </p>
            ) : null}
          </div>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const date = formData.get("date")?.toString() ?? "";
              const time = formData.get("time")?.toString() || "12:00";
              const offsetMinutes = getOffsetMinutesForLocalDateTime(date, time);
              if (offsetMinutes !== null) {
                formData.set("timeZoneOffsetStart", offsetMinutes.toString());
              }
              startTransition(async () => {
                try {
                  const result = await onSchedule(formData);
                  toast.success("Event created from idea!");
                  if (result?.googleSync?.attempted && !result.googleSync.success) {
                    toast.warning(
                      result.googleSync.message ??
                        "Created in Duet, but Google Calendar sync failed.",
                    );
                  } else if (result?.googleSync?.info) {
                    toast.info(result.googleSync.info);
                  }
                  setIsScheduleOpen(false);
                  if (result?.eventId) {
                    router.push(`/events/${result.eventId}`);
                  } else {
                    router.refresh();
                  }
                } catch {
                  toast.error("Failed to schedule idea");
                }
              });
            }}
          >
            <input type="hidden" name="ideaId" value={idea.id} />
            <input
              className="rounded-xl border border-transparent bg-[var(--surface-50)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
              name="date"
              type="date"
              min={todayStr}
              required
            />
            <input
              className="rounded-xl border border-transparent bg-[var(--surface-50)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
              name="time"
              type="time"
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
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsScheduleOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={isPending}>
                {isPending ? "Creating..." : "Create event"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit idea"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const title = formData.get("title")?.toString().trim() ?? "";
            if (!title) {
              return;
            }
            startTransition(async () => {
              try {
                await onEdit(formData);
                toast.success("Idea updated!");
                router.refresh();
                setIsEditOpen(false);
              } catch {
                toast.error("Failed to update idea");
              }
            });
          }}
        >
          <input type="hidden" name="ideaId" value={idea.id} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
              Title
            </label>
            <input
              className="w-full rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
              name="title"
              defaultValue={idea.title}
              placeholder="Idea title"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
              Description
            </label>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
              name="description"
              defaultValue={idea.description ?? ""}
              placeholder="Details, links, or vibe"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
              Tags
            </label>
            <TagInput name="tags" defaultValue={idea.tags.join(", ")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
              Place
            </label>
            {hasMapsKey ? (
              <PlaceSearch
                label={null}
                placeholder="Search a place"
                apiKey={mapsApiKey}
                initialValue={idea.placeName ?? undefined}
                onSelect={(selection) => setEditPlace(selection)}
              />
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Place search is unavailable because `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not set.
              </p>
            )}
          </div>
          <input type="hidden" name="placeId" value={editPlace?.placeId ?? ""} />
          <input type="hidden" name="placeName" value={editPlace?.name ?? ""} />
          <input type="hidden" name="placeAddress" value={editPlace?.address ?? ""} />
          <input type="hidden" name="placeWebsite" value={editPlace?.website ?? ""} />
          <input
            type="hidden"
            name="placeOpeningHours"
            value={editPlace?.openingHours ? JSON.stringify(editPlace.openingHours) : ""}
          />
          <input
            type="hidden"
            name="placePhotoUrls"
            value={editPlace?.photoUrls ? JSON.stringify(editPlace.photoUrls) : ""}
          />
          <input type="hidden" name="placeLat" value={editPlace?.lat?.toString() ?? ""} />
          <input type="hidden" name="placeLng" value={editPlace?.lng?.toString() ?? ""} />
          <input type="hidden" name="placeUrl" value={editPlace?.url ?? ""} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          const formData = new FormData();
          formData.append("ideaId", idea.id);
          await onDelete(formData);
          toast.success("Idea deleted");
          router.push(calendarHref);
        }}
        title="Delete idea"
        message={`Are you sure you want to delete "${idea.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
