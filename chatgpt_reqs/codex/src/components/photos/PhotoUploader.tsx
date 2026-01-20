"use client";

import { useState } from "react";

type PhotoUploaderProps = {
  cloudName?: string;
  uploadPreset?: string;
  formId: string;
  inputId: string;
};

export default function PhotoUploader({
  cloudName,
  uploadPreset,
  formId,
  inputId,
}: PhotoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = Boolean(cloudName && uploadPreset);

  const handleUpload = async () => {
    if (!file || !cloudName || !uploadPreset) {
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("upload_preset", uploadPreset);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: payload,
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message || "Upload failed.");
        return;
      }
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      const form = document.getElementById(formId) as HTMLFormElement | null;
      if (!input || !form) {
        setError("Upload succeeded but form is missing.");
        return;
      }
      input.value = data.secure_url;
      form.requestSubmit();
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <input
        className="flex-1 rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <button
        className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-60"
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading || !canUpload}
      >
        {isUploading ? "Uploading..." : "Upload photo"}
      </button>
      {!canUpload ? (
        <p className="w-full text-xs text-rose-600">
          Missing Cloudinary config. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and
          `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
        </p>
      ) : null}
      {error ? (
        <p className="w-full text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
