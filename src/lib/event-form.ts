import { parseLocalDateTime, parseOffsetMinutes } from "@/lib/date-time";
import { parseJsonStringArray } from "@/lib/parsers";
import { normalizeTags } from "@/lib/tags";

export type ParsedPlaceFields = {
  placeId: string | null;
  placeName: string | null;
  placeAddress: string | null;
  placeLat: number | null;
  placeLng: number | null;
  placeUrl: string | null;
  placeWebsite: string | null;
  placeOpeningHours: string[] | null;
  placePhotoUrls: string[] | null;
};

export type ParsedEventFormData = ParsedPlaceFields & {
  title: string;
  description: string | null;
  dateTimeStart: Date;
  dateTimeEnd: Date | null;
  timeIsSet: boolean;
  tags: string[];
  addToGoogleCalendar: boolean;
};

function optionalString(formData: FormData, key: string) {
  return formData.get(key)?.toString() || null;
}

function optionalTrimmedString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() || null;
}

function optionalFloat(formData: FormData, key: string) {
  const value = Number.parseFloat(formData.get(key)?.toString() ?? "");
  return Number.isNaN(value) ? null : value;
}

export function parsePlaceFields(formData: FormData): ParsedPlaceFields {
  return {
    placeId: optionalString(formData, "placeId"),
    placeName: optionalString(formData, "placeName"),
    placeAddress: optionalString(formData, "placeAddress"),
    placeWebsite: optionalString(formData, "placeWebsite"),
    placeOpeningHours: parseJsonStringArray(
      formData.get("placeOpeningHours")?.toString() ?? null,
    ),
    placePhotoUrls: parseJsonStringArray(
      formData.get("placePhotoUrls")?.toString() ?? null,
    ),
    placeLat: optionalFloat(formData, "placeLat"),
    placeLng: optionalFloat(formData, "placeLng"),
    placeUrl: optionalString(formData, "placeUrl"),
  };
}

export function parseEventFormData(formData: FormData): ParsedEventFormData {
  const title = optionalTrimmedString(formData, "title") ?? "";
  const description = optionalTrimmedString(formData, "description");
  const date = formData.get("date")?.toString();
  const endDate = optionalTrimmedString(formData, "endDate") ?? "";
  const rawTime = formData.get("time")?.toString() || "";
  const timeIsSet = rawTime.length > 0;
  const time = timeIsSet ? rawTime : "12:00";
  const rawTimeEnd = formData.get("timeEnd")?.toString() || "";

  if (!title || !date) {
    throw new Error("Title and date are required.");
  }

  const startOffsetMinutes = parseOffsetMinutes(formData.get("timeZoneOffsetStart"));
  const endOffsetMinutes = parseOffsetMinutes(formData.get("timeZoneOffsetEnd"));
  const dateTimeStart =
    parseLocalDateTime({
      date,
      time,
      offsetMinutes: startOffsetMinutes,
    }) ?? new Date(`${date}T${time}`);
  if (Number.isNaN(dateTimeStart.getTime())) {
    throw new Error("Invalid date. Please try again.");
  }

  const hasMultiDayRange = Boolean(endDate && endDate !== date);
  const effectiveEndDate = hasMultiDayRange ? endDate : date;
  const rawDateTimeEnd =
    rawTimeEnd || hasMultiDayRange
      ? parseLocalDateTime({
          date: effectiveEndDate,
          time: rawTimeEnd || rawTime || "12:00",
          offsetMinutes: endOffsetMinutes ?? startOffsetMinutes,
        }) ?? new Date(`${effectiveEndDate}T${rawTimeEnd || rawTime || "12:00"}`)
      : null;
  const dateTimeEnd =
    rawDateTimeEnd && !Number.isNaN(rawDateTimeEnd.getTime())
      ? rawDateTimeEnd
      : null;

  if (dateTimeEnd && dateTimeEnd < dateTimeStart) {
    throw new Error("End date cannot be before the start date.");
  }

  return {
    title,
    description,
    dateTimeStart,
    dateTimeEnd,
    timeIsSet,
    tags: normalizeTags(formData.get("tags")),
    addToGoogleCalendar: formData.get("addToGoogleCalendar") === "true",
    ...parsePlaceFields(formData),
  };
}
