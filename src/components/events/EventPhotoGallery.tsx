"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  cloudName?: string;
  uploadPreset?: string;
  currentUser: {
    name: string | null;
    email: string;
  };
  onCreatePhoto: (input: { storageUrl: string }) => Promise<{
    id: string;
    storageUrl: string;
    createdAtIso: string;
  }>;
  onDeletePhoto: (input: { photoId: string }) => Promise<void>;
  onSetPhotoAsCover: (input: { photoId: string }) => Promise<void>;
};

type UploadMode = "upload" | "url";

function formatFileSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function getUploaderLabel(photo: EventPhoto) {
  return photo.uploadedBy.name || photo.uploadedBy.email;
}

function uploadToCloudinary(params: {
  file: File;
  cloudName: string;
  uploadPreset: string;
  onProgress: (value: number) => void;
}) {
  const { file, cloudName, uploadPreset, onProgress } = params;

  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    );

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    request.onload = () => {
      try {
        const payload = JSON.parse(request.responseText) as {
          secure_url?: string;
          error?: { message?: string };
        };
        if (request.status >= 200 && request.status < 300 && payload.secure_url) {
          resolve(payload.secure_url);
          return;
        }
        reject(new Error(payload.error?.message || "Cloudinary upload failed."));
      } catch {
        reject(new Error("Cloudinary upload failed."));
      }
    };

    request.onerror = () => {
      reject(new Error("Cloudinary upload failed."));
    };

    const body = new FormData();
    body.set("file", file);
    body.set("upload_preset", uploadPreset);
    request.send(body);
  });
}

export default function EventPhotoGallery({
  initialPhotos,
  canUploadDirectly,
  cloudName,
  uploadPreset,
  currentUser,
  onCreatePhoto,
  onDeletePhoto,
  onSetPhotoAsCover,
}: EventPhotoGalleryProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [mode, setMode] = useState<UploadMode>(canUploadDirectly ? "upload" : "url");
  const [urlValue, setUrlValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [photoPendingDelete, setPhotoPendingDelete] = useState<EventPhoto | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  useEffect(() => {
    if (!canUploadDirectly && mode === "upload") {
      setMode("url");
    }
  }, [canUploadDirectly, mode]);

  const hasReachedPhotoLimit = photos.length >= MAX_EVENT_PHOTOS;
  const helperText = useMemo(() => {
    if (hasReachedPhotoLimit) {
      return `This memory already has the maximum of ${MAX_EVENT_PHOTOS} photos.`;
    }
    if (!canUploadDirectly) {
      return "Direct upload is not configured. You can still paste an HTTPS image URL.";
    }
    return `Upload images up to ${formatFileSize(MAX_EVENT_PHOTO_FILE_SIZE_BYTES)} or paste an HTTPS image URL.`;
  }, [canUploadDirectly, hasReachedPhotoLimit]);

  async function persistPhoto(storageUrl: string) {
    const createdPhoto = await onCreatePhoto({ storageUrl });
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
    setUrlValue("");
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleUrlSubmit() {
    if (hasReachedPhotoLimit) {
      return;
    }

    const trimmed = urlValue.trim();
    if (!trimmed) {
      setInlineError("Paste an HTTPS image URL first.");
      return;
    }

    setInlineError(null);
    startTransition(async () => {
      try {
        await persistPhoto(trimmed);
        resetUploadState();
        toast.success("Photo added.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to add photo.";
        setInlineError(message);
        toast.error(message);
      }
    });
  }

  function handleFileSubmit() {
    if (hasReachedPhotoLimit) {
      return;
    }
    if (!selectedFile || !cloudName || !uploadPreset) {
      setInlineError("Select an image first.");
      return;
    }
    if (selectedFile.size > MAX_EVENT_PHOTO_FILE_SIZE_BYTES) {
      setInlineError(
        `Image is too large. Use a file under ${formatFileSize(MAX_EVENT_PHOTO_FILE_SIZE_BYTES)}.`,
      );
      return;
    }

    setInlineError(null);
    setUploadProgress(0);
    startTransition(async () => {
      try {
        const storageUrl = await uploadToCloudinary({
          file: selectedFile,
          cloudName,
          uploadPreset,
          onProgress: setUploadProgress,
        });
        await persistPhoto(storageUrl);
        resetUploadState();
        toast.success("Photo uploaded.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload photo.";
        setInlineError(message);
        toast.error(message);
      } finally {
        setUploadProgress(null);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Memory photos
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--panel-border)] bg-white/80 p-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            {canUploadDirectly ? (
              <button
                type="button"
                className={`rounded-full px-3 py-1 transition ${
                  mode === "upload"
                    ? "bg-slate-900 text-white"
                    : "text-[var(--text-muted)]"
                }`}
                onClick={() => {
                  setMode("upload");
                  setInlineError(null);
                }}
              >
                Upload
              </button>
            ) : null}
            <button
              type="button"
              className={`rounded-full px-3 py-1 transition ${
                mode === "url"
                  ? "bg-slate-900 text-white"
                  : "text-[var(--text-muted)]"
              }`}
              onClick={() => {
                setMode("url");
                setInlineError(null);
              }}
            >
              Paste URL
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-rose-100/80 bg-white/75 p-4">
          {mode === "upload" && canUploadDirectly ? (
            <div className="grid gap-3">
              <input
                ref={fileInputRef}
                accept="image/*"
                className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] file:mr-3 file:rounded-full file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-rose-700"
                disabled={isPending || hasReachedPhotoLimit}
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                  setInlineError(null);
                }}
                type="file"
              />
              {selectedFile ? (
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                </p>
              ) : null}
              {uploadProgress !== null ? (
                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-rose-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-600 transition-[width]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={!selectedFile || hasReachedPhotoLimit}
                  loading={isPending}
                  onClick={handleFileSubmit}
                  type="button"
                >
                  Upload photo
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <input
                className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
                disabled={isPending || hasReachedPhotoLimit}
                inputMode="url"
                onChange={(event) => {
                  setUrlValue(event.target.value);
                  setInlineError(null);
                }}
                placeholder="https://example.com/photo.jpg"
                type="url"
                value={urlValue}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={!urlValue.trim() || hasReachedPhotoLimit}
                  loading={isPending}
                  onClick={handleUrlSubmit}
                  type="button"
                >
                  Add photo URL
                </Button>
              </div>
            </div>
          )}

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
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-700">
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
        message="Remove this photo from the memory? The image will disappear from Memoris immediately."
        confirmLabel="Remove photo"
        cancelLabel="Keep photo"
        variant="danger"
      />
    </>
  );
}
