"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import PlaceSearch, { PlaceSelection } from "@/components/places/PlaceSearch";
import TagInput from "@/components/ui/TagInput";

type EventEditModalProps = {
  isOpen: boolean;
  onCloseHref: string;
  onSubmit: (formData: FormData) => Promise<void>;
  onDelete: () => Promise<void>;
  mapsApiKey?: string;
  title: string;
  dateValue: string;
  timeValue: string;
  tagsValue: string;
  descriptionValue: string;
  placeName?: string | null;
  placeAddress?: string | null;
  placeLat?: number | null;
  placeLng?: number | null;
  placeId?: string | null;
  placeUrl?: string | null;
  placeWebsite?: string | null;
  placeOpeningHours?: string[] | null;
  placePhotoUrls?: string[] | null;
};

export default function EventEditModal({
  isOpen,
  onCloseHref,
  onSubmit,
  onDelete,
  mapsApiKey,
  title,
  dateValue,
  timeValue,
  tagsValue,
  descriptionValue,
  placeName,
  placeAddress,
  placeLat,
  placeLng,
  placeId,
  placeUrl,
  placeWebsite,
  placeOpeningHours,
  placePhotoUrls,
}: EventEditModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [place, setPlace] = useState<PlaceSelection | null>(
    placeId && placeName && placeLat && placeLng
      ? {
          placeId,
          name: placeName,
          address: placeAddress ?? "",
          lat: placeLat,
          lng: placeLng,
          url: placeUrl ?? "",
          website: placeWebsite ?? "",
          openingHours: placeOpeningHours ?? [],
          photoUrls: placePhotoUrls ?? [],
        }
      : null,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => router.push(onCloseHref)}
      title="Edit event"
    >
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            try {
              await onSubmit(formData);
              toast.success("Event updated!");
              router.push(onCloseHref);
              router.refresh();
            } catch {
              toast.error("Failed to update event");
            }
          });
        }}
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)] md:col-span-2">
          Title
          <input
            className="rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
            name="title"
            defaultValue={title}
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
          Date
          <input
            className="rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
            name="date"
            type="date"
            defaultValue={dateValue}
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
          Time (optional)
          <input
            className="rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
            name="time"
            type="time"
            defaultValue={timeValue}
          />
        </label>
        <div className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
          Tags
          <TagInput name="tags" defaultValue={tagsValue} />
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)] md:col-span-2">
          Notes
          <textarea
            className="min-h-[120px] rounded-xl border border-transparent bg-[var(--surface-50)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--panel-border)] focus:bg-white"
            name="description"
            defaultValue={descriptionValue}
          />
        </label>
        <div className="md:col-span-2">
          <PlaceSearch
            label="Place"
            placeholder="Search a place"
            apiKey={mapsApiKey}
            initialValue={place?.name ?? placeName ?? ""}
            onSelect={(selection) => setPlace(selection)}
          />
        </div>
        <input type="hidden" name="placeId" value={place?.placeId ?? ""} />
        <input type="hidden" name="placeName" value={place?.name ?? ""} />
        <input type="hidden" name="placeAddress" value={place?.address ?? ""} />
        <input type="hidden" name="placeWebsite" value={place?.website ?? ""} />
        <input
          type="hidden"
          name="placeOpeningHours"
          value={
            place?.openingHours ? JSON.stringify(place.openingHours) : ""
          }
        />
        <input
          type="hidden"
          name="placePhotoUrls"
          value={place?.photoUrls ? JSON.stringify(place.photoUrls) : ""}
        />
        <input
          type="hidden"
          name="placeLat"
          value={place?.lat?.toString() ?? ""}
        />
        <input
          type="hidden"
          name="placeLng"
          value={place?.lng?.toString() ?? ""}
        />
        <input type="hidden" name="placeUrl" value={place?.url ?? ""} />
        <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
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
          Deleting removes this event and its comments, photos, and reactions.
        </p>
        <button
          className="mt-4 rounded-full border border-[#a1493d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a1493d] transition hover:bg-[#f2d6d1]"
          type="button"
          onClick={() => setIsDeleteOpen(true)}
        >
          Delete event
        </button>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          await onDelete();
          toast.success("Event deleted");
          router.push(onCloseHref.split("?")[0].replace(/\/events\/[^/]+$/, "/calendar"));
          router.refresh();
        }}
        title="Delete event"
        message="Are you sure you want to delete this event? All comments, photos, and reactions will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </Modal>
  );
}
