"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, Upload } from "lucide-react";

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
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");

  const canUpload = Boolean(cloudName && uploadPreset);

  const submitUrl = (url: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!input || !form) {
      toast.error("Form not found");
      return false;
    }
    input.value = url;
    form.requestSubmit();
    return true;
  };

  const handleUpload = async () => {
    if (!file || !cloudName || !uploadPreset) {
      return;
    }
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
        toast.error(data?.error?.message || "Upload failed");
        return;
      }
      if (submitUrl(data.secure_url)) {
        toast.success("Photo uploaded!");
        setFile(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    try {
      new URL(url); // Validate URL
      if (submitUrl(url)) {
        toast.success("Photo added!");
        setUrlInput("");
      }
    } catch {
      toast.error("Invalid URL");
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "upload"
              ? "bg-rose-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setMode("upload")}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "url"
              ? "bg-rose-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setMode("url")}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Paste URL
        </button>
      </div>

      {mode === "upload" ? (
        <div className="flex flex-wrap gap-2">
          {canUpload ? (
            <>
              <input
                className="flex-1 rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-60"
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading && <Loader2 className="h-3 w-3 animate-spin" />}
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              File upload requires Cloudinary config. Use &quot;Paste URL&quot; instead, or set{" "}
              <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{" "}
              <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input
            className="flex-1 rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
          />
          <button
            className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-60"
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
          >
            Add photo
          </button>
        </div>
      )}
    </div>
  );
}
