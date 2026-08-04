"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadPlacePhotos,
  type ResolvedPlacePhoto,
} from "@/lib/place-photos-client";

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
    photos: ResolvedPlacePhoto[];
    loaded: boolean;
  }>({ placeId: null, photos: [], loaded: false });
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
  const hasFreshResult =
    dynamicPhotoState.loaded && dynamicPhotoState.placeId === placeId;
  const livePhotos = hasFreshResult ? dynamicPhotoState.photos : [];
  const sourcePhotos: ResolvedPlacePhoto[] =
    livePhotos.length > 0
      ? livePhotos
      : validPhotoUrls.map((url) => ({
          url,
          authorAttributions: [],
          googleMapsURI: null,
          flagContentURI: null,
        }));

  const hasVisiblePhoto = sourcePhotos.some(
    (_photoUrl, index) => !failedIndices.includes(index),
  );

  useEffect(() => {
    let cancelled = false;
    if (!placeId) {
      return;
    }

    void loadPlacePhotos(placeId, {
      limit: 3,
      maxWidth: 800,
      maxHeight: 600,
    })
      .catch(() => [])
      .then((photos) => {
        if (!cancelled) {
          setDynamicPhotoState({
            placeId: placeId ?? null,
            photos,
            loaded: true,
          });
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
      {sourcePhotos.map((photo, index) => {
        if (failedIndices.includes(index)) {
          return null;
        }

        const attributions = photo.authorAttributions;

        return (
          <figure key={`${photo.url}-${index}`} className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={alt}
              className="h-[72px] w-full rounded-xl object-cover"
              src={photo.url}
              onError={() =>
                setFailedIndices((prev) =>
                  prev.includes(index) ? prev : [...prev, index],
                )
              }
            />
            {photo.googleMapsURI || attributions.length > 0 ? (
              <figcaption className="mt-1 text-[9px] leading-3 text-[var(--text-tertiary)]">
                {attributions.length > 0 ? <span>Photo: </span> : null}
                {attributions.map((attribution, attributionIndex) => (
                  <span key={`${attribution.displayName}-${attributionIndex}`}>
                    {attributionIndex > 0 ? ", " : null}
                    {attribution.uri ? (
                      <a
                        className="hover:text-[var(--text-secondary)] hover:underline"
                        href={attribution.uri}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {attribution.displayName}
                      </a>
                    ) : (
                      attribution.displayName
                    )}
                  </span>
                ))}
                {attributions.length > 0 && photo.googleMapsURI ? (
                  <span> · </span>
                ) : null}
                {photo.googleMapsURI ? (
                  <a
                    className="whitespace-nowrap font-medium hover:text-[var(--text-secondary)] hover:underline"
                    href={photo.googleMapsURI}
                    rel="noreferrer"
                    target="_blank"
                    translate="no"
                  >
                    Google Maps
                  </a>
                ) : null}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
