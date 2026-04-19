"use client";

import { useEffect, useMemo, useState } from "react";
import { loadPlacePhotoUrls } from "@/lib/place-photos-client";

type PlacePhotoStripProps = {
  photoUrls: string[];
  placeId?: string | null;
  alt: string;
  className?: string;
};

export default function PlacePhotoStrip({
  photoUrls,
  placeId,
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
  const [dynamicPhotoState, setDynamicPhotoState] = useState<{
    placeId: string | null;
    urls: string[];
  }>({ placeId: null, urls: [] });
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
  const hasFreshResult = dynamicPhotoState.placeId === placeId;
  const sourcePhotoUrls =
    placeId
      ? hasFreshResult
        ? dynamicPhotoState.urls
        : []
      : validPhotoUrls;

  const hasVisiblePhoto = sourcePhotoUrls.some(
    (_photoUrl, index) => !failedIndices.includes(index),
  );

  useEffect(() => {
    let cancelled = false;
    if (!placeId) {
      return;
    }

    void loadPlacePhotoUrls(placeId, {
      limit: 3,
      maxWidth: 800,
      maxHeight: 600,
    }).then((urls) => {
      if (!cancelled) {
        setDynamicPhotoState({ placeId: placeId ?? null, urls });
        setFailedIndices([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  if (!hasVisiblePhoto) {
    return null;
  }

  return (
    <div className={`grid grid-cols-3 gap-2 ${className ?? ""}`.trim()}>
      {sourcePhotoUrls.map((photoUrl, index) => {
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
