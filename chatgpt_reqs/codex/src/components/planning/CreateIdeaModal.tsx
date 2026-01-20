"use client";

import { Fragment, useState, useTransition } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import PlaceSearch, { PlaceSelection } from "@/components/places/PlaceSearch";

type CreateIdeaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  mapsApiKey?: string;
};

export default function CreateIdeaModal({
  isOpen,
  onClose,
  onSubmit,
  mapsApiKey,
}: CreateIdeaModalProps) {
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[var(--shadow-sm)]">
                    <Lightbulb className="h-5 w-5" />
                  </span>
                  New idea
                </Dialog.Title>
                <form
                  className="mt-5 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    startTransition(async () => {
                      await onSubmit(formData);
                      router.refresh();
                      onClose();
                    });
                  }}
                >
                  <input
                    className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-amber-400"
                    name="title"
                    placeholder="Idea title"
                    required
                  />
                  <textarea
                    className="min-h-[120px] rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-amber-400"
                    name="description"
                    placeholder="Notes, links, or vibe"
                  />
                  <input
                    className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-amber-400"
                    name="tags"
                    placeholder="tags (comma separated)"
                  />
                  <PlaceSearch
                    label="Place"
                    placeholder="Search a place"
                    apiKey={mapsApiKey}
                    onSelect={(selection) => setPlace(selection)}
                  />
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
                      className="button-hover rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
                      type="submit"
                      disabled={isPending}
                    >
                      {isPending ? "Creating..." : "Create idea"}
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
