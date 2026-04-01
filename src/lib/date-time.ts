function parseDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return {
    year: Number.parseInt(year, 10),
    month: Number.parseInt(month, 10),
    day: Number.parseInt(day, 10),
  };
}

function parseTimeParts(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, hour, minute] = match;
  return {
    hour: Number.parseInt(hour, 10),
    minute: Number.parseInt(minute, 10),
  };
}

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

export function parseOffsetMinutes(value: FormDataEntryValue | string | null | undefined) {
  const raw = typeof value === "string" ? value : value?.toString();
  if (!raw) {
    return null;
  }

  const offsetMinutes = Number.parseInt(raw, 10);
  return Number.isFinite(offsetMinutes) ? offsetMinutes : null;
}

export function parseLocalDateTime(params: {
  date: string;
  time: string;
  offsetMinutes: number | null | undefined;
}) {
  const { date, time, offsetMinutes } = params;
  const dateParts = parseDateParts(date);
  const timeParts = parseTimeParts(time);

  if (!dateParts || !timeParts || offsetMinutes === null || offsetMinutes === undefined) {
    return null;
  }

  const utcTimestamp =
    Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      timeParts.hour,
      timeParts.minute,
    ) +
    offsetMinutes * 60_000;
  const parsed = new Date(utcTimestamp);

  return isValidDate(parsed) ? parsed : null;
}

export function formatDateInputValue(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValidDate(date)) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTimeInputValue(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValidDate(date)) {
    return "";
  }

  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getOffsetMinutesForLocalDateTime(date: string, time: string) {
  const dateParts = parseDateParts(date);
  const timeParts = parseTimeParts(time);

  if (!dateParts || !timeParts) {
    return null;
  }

  const localDate = new Date(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
  );

  return isValidDate(localDate) ? localDate.getTimezoneOffset() : null;
}

export function isSameLocalCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
