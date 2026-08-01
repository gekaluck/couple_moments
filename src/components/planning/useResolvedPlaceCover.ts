"use client";

import { useEffect, useMemo, useState } from "react";

import { loadPlacePhotoUrls } from "@/lib/place-photos-client";

type CoverResolution = {
  key: string;
  url: string | null;
};

type UseResolvedPlaceCoverOptions = {
  preferredUrl?: string | null;
  storedPlacePhotoUrl?: string | null;
  placeId?: string | null;
  mapsApiKey?: string;
};

function validHttpUrl(value?: string | null) {
  const url = value?.trim() ?? "";
  return /^https?:\/\//i.test(url) ? url : null;
}

function canLoadImage(url: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

export default function useResolvedPlaceCover({
  preferredUrl,
  storedPlacePhotoUrl,
  placeId,
  mapsApiKey,
}: UseResolvedPlaceCoverOptions) {
  const preferredCandidate = validHttpUrl(preferredUrl);
  const storedCandidate = validHttpUrl(storedPlacePhotoUrl);
  const resolutionKey = JSON.stringify([
    preferredCandidate,
    storedCandidate,
    placeId ?? null,
    mapsApiKey ?? null,
  ]);
  const [resolution, setResolution] = useState<CoverResolution>({
    key: "",
    url: null,
  });
  const candidates = useMemo(
    () =>
      [preferredCandidate, storedCandidate].filter(
        (url, index, list): url is string =>
          Boolean(url) && list.indexOf(url) === index,
      ),
    [preferredCandidate, storedCandidate],
  );

  useEffect(() => {
    let cancelled = false;

    const resolveCover = async () => {
      for (const candidate of candidates) {
        if (await canLoadImage(candidate)) {
          if (!cancelled) setResolution({ key: resolutionKey, url: candidate });
          return;
        }
      }

      if (placeId) {
        const freshUrls = await loadPlacePhotoUrls(placeId, {
          apiKey: mapsApiKey,
          limit: 1,
          maxWidth: 900,
          maxHeight: 700,
        }).catch(() => []);
        const freshUrl = freshUrls[0] ?? null;

        if (freshUrl && (await canLoadImage(freshUrl))) {
          if (!cancelled) setResolution({ key: resolutionKey, url: freshUrl });
          return;
        }
      }

      if (!cancelled) setResolution({ key: resolutionKey, url: null });
    };

    void resolveCover();

    return () => {
      cancelled = true;
    };
  }, [candidates, mapsApiKey, placeId, resolutionKey]);

  const isCurrentResolution = resolution.key === resolutionKey;
  const hasCoverSource = candidates.length > 0 || Boolean(placeId);

  return {
    coverUrl: isCurrentResolution ? resolution.url : null,
    isLoading: hasCoverSource && !isCurrentResolution,
  };
}
