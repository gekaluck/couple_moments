"use client";

import { Fragment, useState, useTransition } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Calendar, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PlaceSearch, { PlaceSelection } from "@/components/places/PlaceSearch";
import TagInput from "@/components/ui/TagInput";

type CreatePlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  mapsApiKey?: string;
};

export default function CreatePlanModal({
  isOpen,
  onClose,
  onSubmit,
  mapsApiKey,
}: CreatePlanModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [place, setPlace] = useState<PlaceSelection | null>(null);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="flex items-center gap-3 text-lg font-semibold text-[var(--text-primary)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[var(--shadow-sm)]">
                    <Calendar className="h-5 w-5" />
                  </span>
                  New plan
                </Dialog.Title>
                <form
                  className="mt-5 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    startTransition(async () => {
                      try {
                        await onSubmit(formData);
                        toast.success("Plan created!");
                        router.refresh();
                        onClose();
                      } catch {
                        toast.error("Failed to create plan");
                      }
                    });
                  }}
                >
                  <input
                    className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-300"
                    name="title"
                    placeholder="Plan title"
                    required
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-300"
                      name="date"
                      type="date"
                      required
                    />
                    <input
                      className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-300"
                      name="time"
                      type="time"
                    />
                  </div>
                  <textarea
                    className="min-h-[100px] rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-300"
                    name="description"
                    placeholder="Notes or details"
                  />
                  <input
                    className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-300"
                    name="location"
                    placeholder="Location"
                  />
                <PlaceSearch
                  label="Place"
                  placeholder="Search a place"
                  apiKey={mapsApiKey}
                  onSelect={(selection) => setPlace(selection)}
                />
                  <TagInput name="tags" />
                  <select
                    className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-300"
                    name="status"
                    defaultValue="PLANNED"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="MEMORY">Memory</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                  <input type="hidden" name="placeId" value={place?.placeId ?? ""} />
                  <input type="hidden" name="placeName" value={place?.name ?? ""} />
                  <input
                    type="hidden"
                    name="placeAddress"
                    value={place?.address ?? ""}
                  />
                  <input
                    type="hidden"
                    name="placeWebsite"
                    value={place?.website ?? ""}
                  />
                  <input
                    type="hidden"
                    name="placeOpeningHours"
                    value={
                      place?.openingHours
                        ? JSON.stringify(place.openingHours)
                        : ""
                    }
                  />
                  <input
                    type="hidden"
                    name="placePhotoUrls"
                    value={
                      place?.photoUrls ? JSON.stringify(place.photoUrls) : ""
                    }
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
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      className="button-hover rounded-xl border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
                      onClick={onClose}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="button-hover inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-50"
                      type="submit"
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                      {isPending ? "Creating..." : "Create plan"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
