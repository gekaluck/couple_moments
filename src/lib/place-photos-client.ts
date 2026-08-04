"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let mapsConfigured = false;

type AuthorAttribution = {
  displayName?: string;
  uri?: string;
  photoURI?: string;
};

type PlacePhoto = {
  getURI: (options: { maxWidth?: number; maxHeight?: number }) => string;
  authorAttributions?: AuthorAttribution[];
  googleMapsURI?: string;
  flagContentURI?: string;
};

type PlaceInstance = {
  photos?: PlacePhoto[];
  fetchFields: (params: { fields: string[] }) => Promise<unknown>;
};

type PlacesLibrary = {
  Place?: new (params: { id: string }) => PlaceInstance;
};

export type ResolvedPlacePhoto = {
  url: string;
  authorAttributions: Array<{
    displayName: string;
    uri: string | null;
    photoURI: string | null;
  }>;
  googleMapsURI: string | null;
  flagContentURI: string | null;
};

function hasLoadedMapsLibrary() {
  return Boolean(
    (
      globalThis as typeof globalThis & {
        google?: { maps?: { importLibrary?: unknown } };
      }
    ).google?.maps?.importLibrary,
  );
}

function ensureMapsConfigured(apiKey?: string) {
  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasLoadedLibrary = hasLoadedMapsLibrary();
  if (!key && !hasLoadedLibrary) {
    return false;
  }

  if (!mapsConfigured) {
    setOptions({
      key: key ?? "already-loaded",
      language: "en",
    } as Parameters<typeof setOptions>[0]);
    mapsConfigured = true;
  }

  return true;
}

export async function loadPlacePhotos(
  placeId: string,
  options?: {
    apiKey?: string;
    limit?: number;
    maxWidth?: number;
    maxHeight?: number;
  },
) {
  if (!placeId || !ensureMapsConfigured(options?.apiKey)) {
    return [];
  }

  const placesLibrary = (await importLibrary("places")) as unknown as PlacesLibrary;
  if (!placesLibrary.Place) {
    return [];
  }

  const place = new placesLibrary.Place({ id: placeId });
  await place.fetchFields({ fields: ["photos"] });

  return (place.photos ?? [])
    .slice(0, options?.limit ?? 3)
    .map((photo): ResolvedPlacePhoto => ({
      url: photo.getURI({
        maxWidth: options?.maxWidth ?? 800,
        maxHeight: options?.maxHeight ?? 600,
      }),
      authorAttributions: (photo.authorAttributions ?? [])
        .map((attribution) => ({
          displayName: attribution.displayName?.trim() ?? "",
          uri: attribution.uri ?? null,
          photoURI: attribution.photoURI ?? null,
        }))
        .filter((attribution) => Boolean(attribution.displayName)),
      googleMapsURI: photo.googleMapsURI ?? null,
      flagContentURI: photo.flagContentURI ?? null,
    }))
    .filter((photo) => /^https?:\/\//i.test(photo.url));
}

/**
 * URL-only compatibility helper for compact covers. Those thumbnails link to
 * detail pages, where PlacePhotoStrip renders Google's source and author data.
 */
export async function loadPlacePhotoUrls(
  placeId: string,
  options?: {
    apiKey?: string;
    limit?: number;
    maxWidth?: number;
    maxHeight?: number;
  },
) {
  const photos = await loadPlacePhotos(placeId, options);
  return photos.map((photo) => photo.url);
}
