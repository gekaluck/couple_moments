"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let mapsConfigured = false;

type PlacePhoto = {
  getURI: (options: { maxWidth?: number; maxHeight?: number }) => string;
};

type PlaceInstance = {
  photos?: PlacePhoto[];
  fetchFields: (params: { fields: string[] }) => Promise<unknown>;
};

type PlacesLibrary = {
  Place?: new (params: { id: string }) => PlaceInstance;
};

function ensureMapsConfigured(apiKey?: string) {
  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return false;
  }

  if (!mapsConfigured) {
    setOptions({ key, language: "en" } as Parameters<typeof setOptions>[0]);
    mapsConfigured = true;
  }

  return true;
}

export async function loadPlacePhotoUrls(
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
    .map((photo) =>
      photo.getURI({
        maxWidth: options?.maxWidth ?? 800,
        maxHeight: options?.maxHeight ?? 600,
      }),
    )
    .filter((url) => /^https?:\/\//i.test(url));
}
