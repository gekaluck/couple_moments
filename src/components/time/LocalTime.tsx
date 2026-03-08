"use client";

import type { ComponentPropsWithoutRef } from "react";

import type { CalendarTimeFormat } from "@/lib/calendar";

type TimeProps = ComponentPropsWithoutRef<"time"> & {
  value: Date | string | number;
  options?: Intl.DateTimeFormatOptions;
  timeFormat?: CalendarTimeFormat;
  fallback?: string;
};

type RelativeTimeProps = ComponentPropsWithoutRef<"time"> & {
  value: Date | string | number;
  fallback?: string;
};

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function buildOptions(
  options: Intl.DateTimeFormatOptions | undefined,
  timeFormat: CalendarTimeFormat,
) {
  if (!options) {
    return undefined;
  }

  if (
    options.hour12 !== undefined ||
    (options.hour === undefined && options.minute === undefined)
  ) {
    return options;
  }

  return {
    ...options,
    hour12: timeFormat === "12h",
  };
}

function formatDateLabel(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions | undefined,
  timeFormat: CalendarTimeFormat,
  fallback?: string,
) {
  const date = toDate(value);
  if (!isValidDate(date)) {
    return { date, label: fallback ?? "" };
  }

  const formatter = new Intl.DateTimeFormat(
    "en-US",
    buildOptions(options, timeFormat),
  );
  return { date, label: formatter.format(date) };
}

export default function LocalTime({
  value,
  options,
  timeFormat = "24h",
  fallback,
  children,
  ...props
}: TimeProps) {
  const { date, label } = formatDateLabel(value, options, timeFormat, fallback);

  return (
    <time
      {...props}
      dateTime={isValidDate(date) ? date.toISOString() : undefined}
      suppressHydrationWarning
    >
      {children ?? label}
    </time>
  );
}

function formatRelativeLabel(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function LocalTimeAgo({
  value,
  fallback,
  children,
  ...props
}: RelativeTimeProps) {
  const date = toDate(value);
  const label = isValidDate(date) ? formatRelativeLabel(date) : fallback ?? "";

  return (
    <time
      {...props}
      dateTime={isValidDate(date) ? date.toISOString() : undefined}
      suppressHydrationWarning
    >
      {children ?? label}
    </time>
  );
}

export function formatRelativeDayLabel(value: Date | string | number) {
  const date = toDate(value);
  if (!isValidDate(date)) {
    return "";
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
