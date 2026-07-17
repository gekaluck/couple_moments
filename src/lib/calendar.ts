export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

export type CalendarTimeFormat = "24h" | "12h";

export const DEFAULT_CALENDAR_TIME_ZONE = "UTC";

export function resolveCalendarTimeZone(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_CALENDAR_TIME_ZONE;
  }

  let candidate = value;
  try {
    candidate = decodeURIComponent(value);
  } catch {
    // Keep the raw cookie value when it is not URI encoded.
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return DEFAULT_CALENDAR_TIME_ZONE;
  }
}

export function resolveCalendarTimeFormat(
  value: string | null | undefined,
): CalendarTimeFormat {
  return value === "12h" ? "12h" : "24h";
}

export function getMonthGrid(date: Date, weekStartsOn: 0 | 1 = 0) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // Calculate offset based on week start (0 = Sunday, 1 = Monday)
  const startOffset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push({
      date: day,
      isCurrentMonth: day.getMonth() === month,
    });
  }

  return days;
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function utcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftDateKey(key: string, deltaDays: number) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return utcDateKey(date);
}

export function formatEventTime(
  date: Date,
  format: CalendarTimeFormat = "24h",
  timeZone?: string,
) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: format === "12h",
    timeZone,
  });
}
