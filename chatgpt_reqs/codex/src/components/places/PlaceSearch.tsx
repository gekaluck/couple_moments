"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

declare const google: any;

let mapsConfigured = false;

export type PlaceSelection = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  url: string;
  website?: string;
  openingHours?: string[];
  photoUrls?: string[];
};

type PlaceSearchProps = {
  label?: string;
  placeholder?: string;
  initialValue?: string;
  apiKey?: string;
  onSelect: (place: PlaceSelection) => void;
};

export default function PlaceSearch({
  label = "Place",
  placeholder = "Search a place",
  initialValue,
  apiKey,
  onSelect,
}: PlaceSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initialValue ?? "");
  const hasKey = Boolean(apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !inputRef.current) {
      return;
    }

    let autocomplete: any = null;

    if (!mapsConfigured) {
      setOptions({ apiKey: key });
      mapsConfigured = true;
    }

    importLibrary("places").then(() => {
      if (!inputRef.current) {
        return;
      }
      const service = new google.maps.places.PlacesService(
        document.createElement("div"),
      );
      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["place_id", "name", "formatted_address", "geometry", "url"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();
        if (!place?.place_id || !place.geometry?.location) {
          return;
        }
        const baseSelection: PlaceSelection = {
          placeId: place.place_id,
          name: place.name ?? "Untitled place",
          address: place.formatted_address ?? "",
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          url: place.url ?? "",
        };

        service.getDetails(
          {
            placeId: place.place_id,
            fields: ["website", "opening_hours", "photos", "url", "name"],
          },
          (details: any, status: any) => {
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !details
            ) {
              setValue(baseSelection.name);
              onSelect(baseSelection);
              return;
            }
            const selection: PlaceSelection = {
              ...baseSelection,
              website: details.website ?? "",
              openingHours: details.opening_hours?.weekday_text ?? [],
              photoUrls: Array.isArray(details.photos)
                ? details.photos
                    .slice(0, 3)
                    .map((photo: any) =>
                      photo.getUrl({ maxWidth: 800, maxHeight: 600 }),
                    )
                : [],
              url: details.url ?? baseSelection.url,
              name: details.name ?? baseSelection.name,
            };
            setValue(selection.name);
            onSelect(selection);
          },
        );
      });
    });

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [apiKey, onSelect]);

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
      {label}
      <input
        ref={inputRef}
        className="rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {!hasKey ? (
        <span className="text-xs text-rose-600">
          Maps API key missing. Check `.env.local` and restart dev server.
        </span>
      ) : null}
    </label>
  );
}
