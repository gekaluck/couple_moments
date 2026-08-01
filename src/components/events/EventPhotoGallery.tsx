"use client";

import { Dialog, Transition } from "@headlessui/react";
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, X } from "lucide-react";
import { Fragment, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/ConfirmDialog";
import Button from "@/components/ui/Button";
import {
  MAX_EVENT_PHOTOS,
  MAX_EVENT_PHOTO_FILE_SIZE_BYTES,
} from "@/lib/event-photos";

type EventPhoto = {
  id: string;
  storageUrl: string;
  createdAtIso: string;
  isCover: boolean;
  uploadedBy: {
    name: string | null;
    email: string;
  };
};

type EventPhotoGalleryProps = {
  initialPhotos: EventPhoto[];
  canUploadDirectly: boolean;
  currentUser: {
    name: string | null;
    email: string;
  };
  onUploadPhoto: (formData: FormData) => Promise<
    | {
        success: true;
        data: {
          id: string;
          storageUrl: string;
          createdAtIso: string;
        };
      }
    | {
        success: false;
        error: string;
      }
  >;
  onDeletePhoto: (input: { photoId: string }) => Promise<void>;
  onSetPhotoAsCover: (input: { photoId: string }) => Promise<void>;
};

function formatFileSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function getUploaderLabel(photo: EventPhoto) {
  return photo.uploadedBy.name || photo.uploadedBy.email;
}

export default function EventPhotoGallery({
  initialPhotos,
  canUploadDirectly,
  currentUser,
  onUploadPhoto,
  onDeletePhoto,
  onSetPhotoAsCover,
}: EventPhotoGalleryProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [photoPendingDelete, setPhotoPendingDelete] = useState<EventPhoto | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Adjust state during render (instead of effects) when server data changes.
  const [prevInitialPhotos, setPrevInitialPhotos] = useState(initialPhotos);
  if (prevInitialPhotos !== initialPhotos) {
    setPrevInitialPhotos(initialPhotos);
    setPhotos(initialPhotos);
  }
  const hasReachedPhotoLimit = photos.length >= MAX_EVENT_PHOTOS;
  const selectedPhotoIndex = photos.findIndex((photo) => photo.id === selectedPhotoId);
  const selectedPhoto = selectedPhotoIndex >= 0 ? photos[selectedPhotoIndex] : null;
  const helperText = hasReachedPhotoLimit
    ? `This memory already has the maximum of ${MAX_EVENT_PHOTOS} photos.`
    : canUploadDirectly
      ? `Choose an image up to ${formatFileSize(MAX_EVENT_PHOTO_FILE_SIZE_BYTES)} from your device.`
      : "Photo uploads are unavailable because storage is not configured.";

  function appendCreatedPhoto(createdPhoto: {
    id: string;
    storageUrl: string;
    createdAtIso: string;
  }) {
    setPhotos((current) => [
      ...current,
      {
        id: createdPhoto.id,
        storageUrl: createdPhoto.storageUrl,
        createdAtIso: createdPhoto.createdAtIso,
        uploadedBy: {
          name: currentUser.name,
          email: currentUser.email,
        },
        isCover: current.length === 0,
      },
    ]);
  }

  function resetUploadState() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelected(file: File | null) {
    if (hasReachedPhotoLimit) {
      return;
    }
    if (!file) {
      setInlineError("Select an image first.");
      return;
    }
    if (file.size > MAX_EVENT_PHOTO_FILE_SIZE_BYTES) {
      setInlineError(
        `Image is too large. Use a file under ${formatFileSize(MAX_EVENT_PHOTO_FILE_SIZE_BYTES)}.`,
      );
      resetUploadState();
      return;
    }

    setSelectedFile(file);
    setInlineError(null);
    startTransition(async () => {
      try {
        const body = new FormData();
        body.set("photo", file);
        const result = await onUploadPhoto(body);
        if (!result.success) {
          const message = result.error || "Failed to upload photo.";
          setInlineError(message);
          toast.error(message);
          resetUploadState();
          return;
        }
        appendCreatedPhoto(result.data);
        resetUploadState();
        toast.success("Photo uploaded.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload photo.";
        setInlineError(message);
        toast.error(message);
        resetUploadState();
      }
    });
  }

  async function handleConfirmDelete() {
    if (!photoPendingDelete) {
      return;
    }

    await onDeletePhoto({ photoId: photoPendingDelete.id });
    setPhotos((current) => {
      const remaining = current.filter((photo) => photo.id !== photoPendingDelete.id);
      if (remaining.length > 0 && !remaining.some((photo) => photo.isCover)) {
        return remaining.map((photo, index) => ({
          ...photo,
          isCover: index === 0,
        }));
      }
      return remaining;
    });
    setPhotoPendingDelete(null);
    toast.success("Photo removed.");
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      try {
        await onSetPhotoAsCover({ photoId });
        setPhotos((current) =>
          current.map((photo) => ({
            ...photo,
            isCover: photo.id === photoId,
          })),
        );
        toast.success("Thumbnail updated.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update thumbnail.";
        toast.error(message);
      }
    });
  }

  return (
    <>
      <section className="rounded-2xl border border-rose-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(255,240,246,0.72))] p-4 shadow-[var(--shadow-sm)] md:p-6">
        <div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Memory photos
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          accept="image/*"
          className="sr-only"
          disabled={!canUploadDirectly || isPending || hasReachedPhotoLimit}
          id="event-photo-upload"
          onChange={(event) => handleFileSelected(event.target.files?.[0] ?? null)}
          type="file"
        />

        <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-rose-100/80 bg-white shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
              >
                <button
                  className="group block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-400"
                  type="button"
                  aria-label={`View memory photo uploaded by ${getUploaderLabel(photo)}`}
                  onClick={() => setSelectedPhotoId(photo.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Memory uploaded by ${getUploaderLabel(photo)}`}
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    src={photo.storageUrl}
                  />
                </button>
                <div className="space-y-3 px-3 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {getUploaderLabel(photo)}
                      </p>
                      {photo.isCover ? (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-700">
                          Thumbnail
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Added{" "}
                      {new Date(photo.createdAtIso).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {!photo.isCover ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSetCover(photo.id)}
                        type="button"
                      >
                        Use as thumbnail
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setPhotoPendingDelete(photo)}
                      type="button"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!hasReachedPhotoLimit ? (
              <button
                aria-label="Add memory photo"
                className="group flex min-h-28 w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-white/45 px-4 py-5 text-left transition hover:border-rose-300 hover:bg-white/75 hover:shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-full sm:flex-col sm:text-center"
                disabled={!canUploadDirectly || isPending}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 transition group-hover:scale-105 group-hover:bg-rose-200/80">
                  {isPending ? (
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                  ) : (
                    <Plus className="h-7 w-7" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">
                    {isPending
                      ? "Uploading photo..."
                      : canUploadDirectly
                        ? "Add photo"
                        : "Upload unavailable"}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)] sm:whitespace-normal">
                    {selectedFile
                      ? `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)`
                      : canUploadDirectly
                        ? "Camera or photo library"
                        : "Storage is not configured"}
                  </span>
                </span>
              </button>
            ) : null}
        </div>

        {inlineError ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {inlineError}
          </p>
        ) : null}
      </section>
      <Transition show={Boolean(selectedPhoto)} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[80]"
          onClose={() => setSelectedPhotoId(null)}
          onKeyDown={(event) => {
            if (photos.length < 2 || selectedPhotoIndex < 0) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              const previousIndex =
                (selectedPhotoIndex - 1 + photos.length) % photos.length;
              setSelectedPhotoId(photos[previousIndex].id);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              const nextIndex = (selectedPhotoIndex + 1) % photos.length;
              setSelectedPhotoId(photos[nextIndex].id);
            }
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto p-2 sm:p-5">
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
                <Dialog.Panel className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl">
                  <Dialog.Title className="sr-only">
                    Memory photo viewer
                  </Dialog.Title>
                  <button
                    type="button"
                    aria-label="Close photo viewer"
                    onClick={() => setSelectedPhotoId(null)}
                    className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="relative flex min-h-[55dvh] items-center justify-center bg-black sm:min-h-[68dvh]">
                    {selectedPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={`Memory uploaded by ${getUploaderLabel(selectedPhoto)}`}
                        className="max-h-[calc(100dvh-7.5rem)] w-full object-contain"
                        src={selectedPhoto.storageUrl}
                      />
                    ) : null}

                    {photos.length > 1 ? (
                      <>
                        <button
                          type="button"
                          aria-label="Previous photo"
                          onClick={() => {
                            const previousIndex =
                              (selectedPhotoIndex - 1 + photos.length) % photos.length;
                            setSelectedPhotoId(photos[previousIndex].id);
                          }}
                          className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next photo"
                          onClick={() => {
                            const nextIndex = (selectedPhotoIndex + 1) % photos.length;
                            setSelectedPhotoId(photos[nextIndex].id);
                          }}
                          className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}
                  </div>

                  {selectedPhoto ? (
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-white/75 sm:px-5">
                      <span className="min-w-0 truncate">
                        Added by {getUploaderLabel(selectedPhoto)}
                      </span>
                      <span className="shrink-0 font-semibold text-white">
                        {selectedPhotoIndex + 1} of {photos.length}
                      </span>
                    </div>
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <ConfirmDialog
        isOpen={Boolean(photoPendingDelete)}
        onClose={() => setPhotoPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove photo"
        message="Remove this photo from the memory? The image will disappear from Memories immediately."
        confirmLabel="Remove photo"
        cancelLabel="Keep photo"
        variant="danger"
      />
    </>
  );
}
