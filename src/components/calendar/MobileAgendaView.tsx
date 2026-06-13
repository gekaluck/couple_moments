"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, MapPin, ChevronDown, ChevronUp, Plus, X } from "lucide-react";

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
  editHref?: string | null;
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

export type MonthGridDay = {
  dateKey: string;
  dayOfMonth: number;
  isToday: boolean;
  hasPlan: boolean;
  hasMemory: boolean;
  hasBlock: boolean;
  blockSpansPrev: boolean;
  blockSpansNext: boolean;
  addHref: string;
};

type MonthGrid = {
  weekStartsOn: 0 | 1;
  days: MonthGridDay[];
};

type MobileAgendaViewProps = {
  days: AgendaDayData[];
  todayKey: string;
  timeFormat: "12h" | "24h";
  monthTitle: string;
  monthGrid?: MonthGrid;
};

const DEFAULT_DAYS_SHOWN = 7;
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

function formatFullDayLabel(dateKey: string) {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

type MonthStripProps = {
  grid: MonthGrid;
  selectedKey: string | null;
  onSelectDay: (dateKey: string) => void;
};

function MonthStrip({ grid, selectedKey, onSelectDay }: MonthStripProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const weeks = useMemo(() => {
    if (grid.days.length === 0) {
      return [] as (MonthGridDay | null)[][];
    }
    const firstDow = new Date(grid.days[0].dateKey + "T00:00:00").getDay();
    const offset = (firstDow - grid.weekStartsOn + 7) % 7;
    const cells: (MonthGridDay | null)[] = [
      ...Array.from({ length: offset }, () => null),
      ...grid.days,
    ];
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    const result: (MonthGridDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [grid]);

  if (weeks.length === 0) {
    return null;
  }

  const focusKey = selectedKey ?? null;
  const focusWeekIndex = (() => {
    if (focusKey) {
      const index = weeks.findIndex((week) =>
        week.some((day) => day?.dateKey === focusKey),
      );
      if (index !== -1) {
        return index;
      }
    }
    const todayIndex = weeks.findIndex((week) =>
      week.some((day) => day?.isToday),
    );
    return todayIndex === -1 ? 0 : todayIndex;
  })();
  const visibleWeeks = isExpanded ? weeks : [weeks[focusWeekIndex]];

  const labels = [
    ...WEEKDAY_LABELS.slice(grid.weekStartsOn),
    ...WEEKDAY_LABELS.slice(0, grid.weekStartsOn),
  ];

  return (
    <div className="mb-3 rounded-2xl border border-[var(--panel-border)] bg-white/75 px-2 pt-2 shadow-[var(--shadow-xs)]">
      <div className="grid grid-cols-7">
        {labels.map((label) => (
          <span
            key={label}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]"
          >
            {label}
          </span>
        ))}
      </div>
      {visibleWeeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7">
          {week.map((day, dayIndex) => {
            if (!day) {
              return <span key={`empty-${dayIndex}`} />;
            }
            const hasContent = day.hasPlan || day.hasMemory || day.hasBlock;
            const isMultiDayBlock =
              day.hasBlock && (day.blockSpansPrev || day.blockSpansNext);
            const isSelected = day.dateKey === selectedKey;
            const numberClasses = day.isToday
              ? "flex h-6 w-6 items-center justify-center rounded-full bg-[var(--action-primary)] text-xs font-bold text-white"
              : `flex h-6 w-6 items-center justify-center text-xs ${
                  hasContent
                    ? "font-semibold text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)]"
                }`;

            return (
              <button
                key={day.dateKey}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${formatFullDayLabel(day.dateKey)}${isSelected ? " (selected)" : ""}`}
                className={`relative flex h-12 w-full flex-col items-center rounded-xl pt-1 transition active:scale-95 ${
                  isSelected ? "bg-rose-50 ring-1 ring-rose-300" : ""
                }`}
                onClick={() => onSelectDay(day.dateKey)}
              >
                <span className={numberClasses}>{day.dayOfMonth}</span>
                <span className="mt-0.5 flex h-1 items-center gap-0.5">
                  {day.hasPlan ? (
                    <span className="h-1 w-1 rounded-full bg-[var(--action-primary)]" />
                  ) : null}
                  {day.hasMemory ? (
                    <span className="h-1 w-1 rounded-full bg-[var(--calendar-memory-dot)]" />
                  ) : null}
                  {day.hasBlock && !isMultiDayBlock ? (
                    <span className="h-1 w-1 rounded-full bg-[var(--color-secondary)]" />
                  ) : null}
                </span>
                {isMultiDayBlock ? (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-1 left-0 right-0 h-[3px] bg-[var(--color-secondary)] ${
                      day.blockSpansPrev ? "" : "ml-2 rounded-l-full"
                    } ${day.blockSpansNext ? "" : "mr-2 rounded-r-full"}`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        {isExpanded ? (
          <>
            This week <ChevronUp size={12} />
          </>
        ) : (
          <>
            Full month <ChevronDown size={12} />
          </>
        )}
      </button>
    </div>
  );
}

export default function MobileAgendaView({
  days,
  todayKey,
  timeFormat,
  monthTitle,
  monthGrid,
}: MobileAgendaViewProps) {
  const [showPast, setShowPast] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const resolvedTodayKey = todayKey;

  const daysWithContent = days.filter(
    (day) => day.events.length > 0 || day.blocks.length > 0,
  );

  // Split into past (before today) and from-today-onwards
  const todayIndex = daysWithContent.findIndex(
    (day) => day.dateKey >= resolvedTodayKey,
  );
  const splitAt = todayIndex === -1 ? daysWithContent.length : todayIndex;
  const pastDays = daysWithContent.slice(0, splitAt);
  const upcomingDays = daysWithContent.slice(splitAt);

  function handleSelectDay(dateKey: string) {
    setSelectedKey((prev) => (prev === dateKey ? null : dateKey));
  }

  const visibleUpcoming = showAllUpcoming
    ? upcomingDays
    : upcomingDays.slice(0, DEFAULT_DAYS_SHOWN);
  const hiddenUpcomingCount = upcomingDays.length - DEFAULT_DAYS_SHOWN;

  function renderDay(day: AgendaDayData) {
    const header = formatDayHeader(day.dateIso, resolvedTodayKey, day.dateKey);
    const isToday = day.dateKey === resolvedTodayKey;

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
          {day.blocks.map((block) => {
            const blockStyle = {
              backgroundColor: block.accentSoft,
              borderColor: `color-mix(in srgb, ${block.accentColor} 40%, transparent)`,
            };
            const content = (
              <>
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
                      {block.source === "GOOGLE" && " · Google"}
                    </span>
                  </div>
                </div>
              </>
            );

            return block.editHref ? (
              <Link
                key={`block-${block.id}-${day.dateKey}`}
                href={block.editHref}
                className="agenda-event-row flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 active:scale-[0.99]"
                style={blockStyle}
              >
                {content}
              </Link>
            ) : (
              <div
                key={`block-${block.id}-${day.dateKey}`}
                className="agenda-event-row flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5"
                style={blockStyle}
              >
                {content}
              </div>
            );
          })}

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

  const monthStrip = monthGrid ? (
    <MonthStrip
      grid={monthGrid}
      selectedKey={selectedKey}
      onSelectDay={handleSelectDay}
    />
  ) : null;

  // Day-focused view: a day is selected in the month strip
  if (selectedKey) {
    const selectedDay = daysWithContent.find(
      (day) => day.dateKey === selectedKey,
    );
    const selectedGridDay = monthGrid?.days.find(
      (day) => day.dateKey === selectedKey,
    );

    return (
      <div className="flex flex-col">
        {monthStrip}
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2">
          <span className="min-w-0 truncate text-xs font-semibold text-rose-700">
            {formatFullDayLabel(selectedKey)}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {selectedGridDay ? (
              <Link
                href={selectedGridDay.addHref}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--action-primary)] px-3 py-1.5 text-[11px] font-semibold text-white transition active:scale-95"
              >
                <Plus size={12} strokeWidth={2.5} />
                Add
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-rose-700 transition active:scale-95"
            >
              <X size={12} />
              All days
            </button>
          </span>
        </div>
        {selectedDay ? (
          renderDay(selectedDay)
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 rounded-2xl bg-rose-50 p-4">
              <Clock size={28} className="text-rose-400" />
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)]">
              Nothing planned this day
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              A free evening is a blank canvas
            </p>
          </div>
        )}
      </div>
    );
  }

  if (daysWithContent.length === 0) {
    return (
      <div className="flex flex-col">
        {monthStrip}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 rounded-2xl bg-rose-50 p-4">
            <Clock size={28} className="text-rose-400" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            No events in {monthTitle}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Tap a day above to add your first event, or use the controls at the
            top
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {monthStrip}

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
