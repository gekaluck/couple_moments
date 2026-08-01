"use client";

import { useState, type ReactNode } from "react";

const FALLBACK_COVER = "/whats-ahead-fallback.webp";

type PlanningCoverProps = {
  src?: string | null;
  alt: string;
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
  /**
   * Cards render their title/meta straight on the photo, so the scrim has to be
   * dark enough for white text at the bottom edge. Thumbnails that carry no
   * overlaid text pass `scrim="soft"` to keep the photo bright.
   */
  scrim?: "overlay" | "soft";
};

export default function PlanningCover({
  src,
  alt,
  children,
  className = "",
  isLoading = false,
  scrim = "overlay",
}: PlanningCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc =
    src && failedSrc !== src ? src : isLoading ? null : FALLBACK_COVER;
  const isFallback = imageSrc === FALLBACK_COVER;

  return (
    <div
      className={`relative isolate overflow-hidden bg-rose-100 ${className}`}
      data-fallback-cover={isFallback ? "true" : undefined}
      aria-busy={isLoading && !imageSrc ? "true" : undefined}
    >
      {/* Native img supports user-upload and Google place URLs without a remote-domain allowlist. */}
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={isFallback ? "" : alt}
          className="h-full w-full object-cover transition duration-500 group-hover/plan:scale-[1.015] group-hover/idea:scale-[1.015] group-hover/memory:scale-[1.015]"
          onError={() => {
            if (!isFallback && src) setFailedSrc(src);
          }}
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-gradient-to-br from-rose-100 via-amber-50 to-rose-50" />
      )}
      {scrim === "overlay" ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/45 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35"
        />
      )}
      {children}
    </div>
  );
}
