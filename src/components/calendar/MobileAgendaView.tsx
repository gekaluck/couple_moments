"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";

type AgendaEvent = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStartIso: string;
  dateTimeEndIso: string | null;
  timeIsSet: boolean;
  placeName: string | null;
  isPast: boolean;
  createdByUserId: string;
};

type AgendaBlock = {
  id: string;
  title: string;
  startAtIso: string;
  endAtIso: string;
  creatorName: string;
  source?: string;
  accentColor: string;
  accentSoft: string;
  accentText: string;
};

type AgendaDayData = {
  dateKey: string;
  dateIso: string;
  events: AgendaEvent[];
  blocks: AgendaBlock[];
};

type MobileAgendaViewProps = {
  days: AgendaDayData[];
  todayKey: string;
  timeFormat: "12h" | "24h";
  monthTitle: string;
};

const DEFAULT_DAYS_SHOWN = 7;

function formatTime(isoString: string, timeFormat: "12h" | "24h"): string {
  const date = new Date(isoString);
  if (timeFormat === "12h") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDayHeader(
  dateIso: string,
  todayKey: string,
  dateKey: string,
): { primary: string; secondary: string } {
  const date = new Date(dateIso);

  if (dateKey === todayKey) {
    return {
      primary: "Today",
      secondary: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    };
  }

  const today = new Date(todayKey + "T00:00:00");
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${`${tomorrow.getMonth() + 1}`.padStart(2, "0")}-${`${tomorrow.getDate()}`.padStart(2, "0")}`;
  if (dateKey === tomorrowKey) {
    return {
      primary: "Tomorrow",
      secondary: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    };
  }

  return {
    primary: date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    secondary: "",
  };
}

export default function MobileAgendaView({
  days,
  todayKey,
  timeFormat,
  monthTitle,
}: MobileAgendaViewProps) {
  const [showPast, setShowPast] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  const daysWithContent = days.filter(
    (day) => day.events.length > 0 || day.blocks.length > 0,
  );

  // Split into past (before today) and from-today-onwards
  const todayIndex = daysWithContent.findIndex((day) => day.dateKey >= todayKey);
  const splitAt = todayIndex === -1 ? daysWithContent.length : todayIndex;
  const pastDays = daysWithContent.slice(0, splitAt);
  const upcomingDays = daysWithContent.slice(splitAt);

  if (daysWithContent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 rounded-2xl bg-rose-50 p-4">
          <Clock size={28} className="text-rose-400" />
        </div>
        <p className="text-base font-semibold text-[var(--text-primary)]">
          No events in {monthTitle}
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Tap + to create your first event
        </p>
      </div>
    );
  }

  const visibleUpcoming = showAllUpcoming
    ? upcomingDays
    : upcomingDays.slice(0, DEFAULT_DAYS_SHOWN);
  const hiddenUpcomingCount = upcomingDays.length - DEFAULT_DAYS_SHOWN;

  function renderDay(day: AgendaDayData) {
    const header = formatDayHeader(day.dateIso, todayKey, day.dateKey);
    const isToday = day.dateKey === todayKey;

    return (
      <div key={day.dateKey} className="relative">
        <div
          className={`agenda-day-header px-1 py-2 ${
            isToday ? "border-l-2 border-[var(--action-primary)]" : ""
          }`}
        >
          <div className="flex items-baseline gap-2">
            <span
              className={`text-sm font-semibold ${
                isToday
                  ? "text-[var(--action-primary)]"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {header.primary}
            </span>
            {header.secondary && (
              <span className="text-xs text-[var(--text-muted)]">
                {header.secondary}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pb-3">
          {day.blocks.map((block) => (
            <div
              key={`block-${block.id}-${day.dateKey}`}
              className="agenda-event-row flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5"
              style={{
                backgroundColor: block.accentSoft,
                borderColor: `color-mix(in srgb, ${block.accentColor} 40%, transparent)`,
              }}
            >
              <div
                className="h-8 w-1 flex-shrink-0 rounded-full"
                style={{ backgroundColor: block.accentColor }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: block.accentText }}
                >
                  {block.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: block.accentText, opacity: 0.7 }}>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {formatTime(block.startAtIso, timeFormat)}
                    {" - "}
                    {formatTime(block.endAtIso, timeFormat)}
                  </span>
                  <span>
                    {block.creatorName}
                    {block.source === "GOOGLE_CALENDAR" && " · Google"}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {day.events.map((event) => (
            <Link
              key={`event-${event.id}-${day.dateKey}`}
              href={`/events/${event.id}`}
              className="agenda-event-row flex items-center gap-3 rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2.5 shadow-[var(--shadow-xs)] active:scale-[0.99]"
            >
              <div
                className={`self-stretch w-1 flex-shrink-0 rounded-full ${
                  event.isPast
                    ? "bg-[var(--calendar-memory-dot)]"
                    : "bg-[var(--action-primary)]"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    event.isPast
                      ? "text-[var(--text-secondary)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {event.title}
                </p>
                {event.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">
                    {event.description}
                  </p>
                )}
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  {event.timeIsSet && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} />
                      {formatTime(event.dateTimeStartIso, timeFormat)}
                      {event.dateTimeEndIso && (
                        <>
                          {" - "}
                          {formatTime(event.dateTimeEndIso, timeFormat)}
                        </>
                      )}
                    </span>
                  )}
                  {event.placeName && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin size={11} />
                      <span className="truncate">{event.placeName}</span>
                    </span>
                  )}
                  {!event.timeIsSet && !event.placeName && (
                    <span>Anytime</span>
                  )}
                </div>
              </div>
              <svg
                className="h-4 w-4 flex-shrink-0 text-[var(--text-tertiary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Earlier days toggle */}
      {pastDays.length > 0 && (
        <>
          {!showPast && (
            <button
              type="button"
              onClick={() => setShowPast(true)}
              className="mx-auto mb-3 flex items-center gap-1.5 rounded-full border border-[var(--panel-border)] bg-white/80 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-white active:scale-95"
            >
              <ChevronUp size={14} />
              Show {pastDays.length} earlier day{pastDays.length > 1 ? "s" : ""}
            </button>
          )}
          {showPast && (
            <>
              <button
                type="button"
                onClick={() => setShowPast(false)}
                className="mx-auto mb-3 flex items-center gap-1.5 rounded-full border border-[var(--panel-border)] bg-white/80 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-white active:scale-95"
              >
                <ChevronUp size={14} />
                Hide earlier days
              </button>
              <div className="opacity-60">
                {pastDays.map(renderDay)}
              </div>
            </>
          )}
        </>
      )}

      {/* Today onwards */}
      {visibleUpcoming.map(renderDay)}

      {/* Show more upcoming */}
      {hiddenUpcomingCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAllUpcoming((prev) => !prev)}
          className="mx-auto mt-1 flex items-center gap-1.5 rounded-full border border-[var(--panel-border)] bg-white/80 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-white active:scale-95"
        >
          {showAllUpcoming ? (
            <>
              Show less <ChevronUp size={14} />
            </>
          ) : (
            <>
              Show {hiddenUpcomingCount} more day{hiddenUpcomingCount > 1 ? "s" : ""}{" "}
              <ChevronDown size={14} />
            </>
          )}
        </button>
      )}

      {/* No upcoming content */}
      {upcomingDays.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            No upcoming events this month
          </p>
        </div>
      )}
    </div>
  );
}
