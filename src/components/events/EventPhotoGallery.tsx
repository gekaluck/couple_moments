"use client";

import { useRef, useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Adjust state during render (instead of effects) when server data changes.
  const [prevInitialPhotos, setPrevInitialPhotos] = useState(initialPhotos);
  if (prevInitialPhotos !== initialPhotos) {
    setPrevInitialPhotos(initialPhotos);
    setPhotos(initialPhotos);
  }
  const hasReachedPhotoLimit = photos.length >= MAX_EVENT_PHOTOS;
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
      <section className="rounded-2xl border border-rose-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(255,240,246,0.72))] p-6 shadow-[var(--shadow-sm)]">
        <div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Memory photos
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-rose-100/80 bg-white/75 p-4">
          <input
            ref={fileInputRef}
            accept="image/*"
            className="sr-only"
            disabled={!canUploadDirectly || isPending || hasReachedPhotoLimit}
            id="event-photo-upload"
            onChange={(event) => handleFileSelected(event.target.files?.[0] ?? null)}
            type="file"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {isPending ? "Uploading photo..." : "Add a photo from your device"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {selectedFile
                  ? `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)`
                  : "Use your camera or photo library."}
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              disabled={!canUploadDirectly || hasReachedPhotoLimit}
              loading={isPending}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {canUploadDirectly ? "Choose photo" : "Upload unavailable"}
            </Button>
          </div>

          {inlineError ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {inlineError}
            </p>
          ) : null}
        </div>

        {photos.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-rose-100/80 bg-white shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
              >
                <a
                  className="group block"
                  href={photo.storageUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Memory uploaded by ${getUploaderLabel(photo)}`}
                    className="h-48 w-full object-cover"
                    src={photo.storageUrl}
                  />
                </a>
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
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-rose-200 bg-white/55 px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            Add a photo to make this memory pop.
          </div>
        )}
      </section>
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
