"use client";

import { useMemo, useState } from "react";

type PlacePhotoStripProps = {
  photoUrls: string[];
  alt: string;
  className?: string;
};

export default function PlacePhotoStrip({
  photoUrls,
  alt,
  className,
}: PlacePhotoStripProps) {
  const validPhotoUrls = useMemo(
    () =>
      photoUrls
        .map((url) => url.trim())
        .filter((url) => /^https?:\/\//i.test(url)),
    [photoUrls],
  );
  const [failedIndices, setFailedIndices] = useState<number[]>([]);

  const hasVisiblePhoto = validPhotoUrls.some(
    (_photoUrl, index) => !failedIndices.includes(index),
  );

  if (!hasVisiblePhoto) {
    return null;
  }

  return (
    <div className={`grid grid-cols-3 gap-2 ${className ?? ""}`.trim()}>
      {validPhotoUrls.map((photoUrl, index) => {
        if (failedIndices.includes(index)) {
          return null;
        }

        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${photoUrl}-${index}`}
            alt={alt}
            className="h-[72px] w-full rounded-xl object-cover"
            src={photoUrl}
            onError={() =>
              setFailedIndices((prev) =>
                prev.includes(index) ? prev : [...prev, index],
              )
            }
          />
        );
      })}
    </div>
  );
}
