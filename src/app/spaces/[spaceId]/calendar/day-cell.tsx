import Link from "next/link";

import {
  CalendarTimeFormat,
  dateKeyInTimeZone,
  formatEventTime,
} from "@/lib/calendar";
import { CreatorVisualMap, getCreatorInitials } from "@/lib/creator-colors";

import EventBubble from "./event-bubble";

type EventSummary = {
  id: string;
  title: string;
  dateTimeStart: Date;
  dateTimeEnd: Date | null;
  timeIsSet: boolean;
};

type BlockSummary = {
  id: string;
  title: string;
  note?: string | null;
  createdBy?: { name: string | null; email: string } | null;
  createdByUserId?: string;
  source?: string;
  startAt?: Date;
  endAt?: Date;
};

type DayCellProps = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  isCompact: boolean;
  isSixWeekMonth: boolean;
  events: EventSummary[];
  blocks: BlockSummary[];
  timeFormat: CalendarTimeFormat;
  timeZone: string;
  addEventHref: string;
  currentUserId: string;
  memberVisuals: CreatorVisualMap;
  buildBlockEditHref: (blockId: string) => string;
  referenceNow: Date;
};

function getDayStart(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEventSpanPosition(
  currentDay: Date,
  startAt: Date,
  endAt: Date | null,
  timeZone: string,
): "single" | "start" | "middle" | "end" {
  const day = dateKeyInTimeZone(currentDay, "UTC");
  const startDay = dateKeyInTimeZone(startAt, timeZone);
  const endDay = dateKeyInTimeZone(endAt ?? startAt, timeZone);

  if (startDay === endDay) {
    return "single";
  }
  if (day === startDay) {
    return "start";
  }
  if (day === endDay) {
    return "end";
  }
  return "middle";
}

function formatTimeRange(
  startAt: Date,
  endAt: Date,
  timeFormat: CalendarTimeFormat,
  timeZone: string,
) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: timeFormat === "12h",
    timeZone,
  });

  return `${formatter.format(startAt)} to ${formatter.format(endAt)}`;
}

function isMidnightInTimeZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(value);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  return hour === "00" && minute === "00";
}

function getBlockTimeLabel(
  currentDay: Date,
  startAt: Date | undefined,
  endAt: Date | undefined,
  timeFormat: CalendarTimeFormat,
  timeZone: string,
) {
  if (!startAt || !endAt) return null;

  const isAllDay =
    isMidnightInTimeZone(startAt, timeZone) &&
    isMidnightInTimeZone(endAt, timeZone) &&
    endAt.getTime() - startAt.getTime() >= 86_400_000;
  if (isAllDay) return null;

  const spanPosition = getEventSpanPosition(currentDay, startAt, endAt, timeZone);
  if (spanPosition === "start") {
    return `Starts ${formatEventTime(startAt, timeFormat, timeZone)}`;
  }
  if (spanPosition === "end") {
    return `Ends ${formatEventTime(endAt, timeFormat, timeZone)}`;
  }
  if (spanPosition === "middle") return "Continues";
  return formatEventTime(startAt, timeFormat, timeZone);
}

function getEventTimeLabel(
  event: EventSummary,
  timeFormat: CalendarTimeFormat,
  spanPosition: "single" | "start" | "middle" | "end",
  timeZone: string,
) {
  if (!event.timeIsSet) {
    return spanPosition === "middle" ? "Continues" : "Anytime";
  }

  if (spanPosition === "single") {
    return formatEventTime(event.dateTimeStart, timeFormat, timeZone);
  }

  if (spanPosition === "start") {
    return `Starts ${formatEventTime(event.dateTimeStart, timeFormat, timeZone)}`;
  }

  if (spanPosition === "end" && event.dateTimeEnd) {
    return `Ends ${formatEventTime(event.dateTimeEnd, timeFormat, timeZone)}`;
  }

  return "Continues";
}

function getEventTooltip(
  event: EventSummary,
  timeFormat: CalendarTimeFormat,
  timeZone: string,
) {
  if (!event.timeIsSet) {
    return event.title;
  }

  const range = event.dateTimeEnd
    ? formatTimeRange(event.dateTimeStart, event.dateTimeEnd, timeFormat, timeZone)
    : formatEventTime(event.dateTimeStart, timeFormat, timeZone);

  return `${event.title} | ${range}`;
}

export default function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isPast,
  isWeekend,
  isCompact,
  isSixWeekMonth,
  events,
  blocks,
  timeFormat,
  timeZone,
  addEventHref,
  currentUserId,
  memberVisuals,
  buildBlockEditHref,
  referenceNow,
}: DayCellProps) {
  const dayCellBase = isCompact
    ? "min-h-[96px] p-2"
    : isSixWeekMonth
      ? "min-h-[108px] p-2"
      : "min-h-[124px] p-2.5";
  const hasEvents = events.length > 0;
  const inMonthTone = isToday
    ? "border-[var(--panel-border)] bg-[linear-gradient(175deg,rgba(255,255,255,0.96),rgba(255,236,244,0.82))]"
    : isWeekend
      ? "border-[var(--panel-border)] bg-[linear-gradient(175deg,rgba(255,255,255,0.88),rgba(250,248,255,0.78))]"
      : hasEvents
        ? "border-[var(--panel-border)] bg-[linear-gradient(175deg,rgba(255,255,255,0.9),rgba(255,242,248,0.78))]"
        : "border-[var(--panel-border)] bg-[rgba(255,255,255,0.82)]";
  const datePillClass = isToday
    ? "bg-[var(--action-primary)] text-white shadow-[var(--shadow-sm)]"
    : isCurrentMonth
      ? "bg-white/90 text-[var(--text-primary)]"
      : "bg-white/60 text-[var(--text-tertiary)]";
  const totalItems = events.length + blocks.length;
  const countLabel = totalItems === 1 ? "1 item" : `${totalItems} items`;
  const maxVisibleItems = isCompact ? 2 : 3;
  // Plans are primary, so reserve their preview slots before availability.
  const visibleEvents = events.slice(0, maxVisibleItems);
  const visibleBlocks = blocks.slice(
    0,
    Math.max(0, maxVisibleItems - visibleEvents.length),
  );
  const hiddenEvents = events.slice(visibleEvents.length);
  const hiddenBlocks = blocks.slice(visibleBlocks.length);
  const hiddenCount = hiddenEvents.length + hiddenBlocks.length;

  return (
    <div
      className={`group/day relative rounded-xl border text-xs transition duration-200 hover:border-rose-200 hover:shadow-[var(--shadow-sm)] ${dayCellBase} ${
        isCurrentMonth
          ? inMonthTone
          : "border-[var(--panel-border)] bg-[var(--surface-50)] text-[var(--surface-400)] opacity-55"
      } ${isPast ? "opacity-65" : ""}`}
    >
      <Link
        aria-label={`Add event on ${date.toDateString()}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/35"
        href={addEventHref}
      />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${datePillClass}`}
        >
          {date.getDate()}
        </span>
        {totalItems > 0 ? (
          <span
            className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white/88 px-1.5 text-[10px] font-semibold text-[var(--text-tertiary)]"
            title={countLabel}
          >
            {totalItems}
          </span>
        ) : null}
      </div>
      <div className="relative z-10 mt-2 flex flex-col gap-1">
        {visibleBlocks.map((block) => {
          const isExternal = block.source === "GOOGLE";
          const createdByUserId = block.createdByUserId || "external";
          const creatorAccent = memberVisuals[createdByUserId]?.accent;
          const blockAccent = creatorAccent?.accent ?? "var(--color-secondary)";
          const blockSoft = creatorAccent?.accentSoft ?? "var(--color-secondary-soft)";
          const blockText = creatorAccent?.accentText ?? "var(--idea-new-text)";
          const currentDay = getDayStart(date);
          const blockStartDay = block.startAt ? getDayStart(block.startAt) : null;
          const blockEndDay = block.endAt ? getDayStart(block.endAt) : null;
          const isMultiDay = Boolean(
            blockStartDay && blockEndDay && blockStartDay < blockEndDay,
          );
          const isStartDay = Boolean(
            blockStartDay && blockStartDay.getTime() === currentDay.getTime(),
          );
          const isContinuation = isMultiDay && !isStartDay;
          const creatorLabel =
            memberVisuals[createdByUserId]?.displayName ??
            block.createdBy?.name ??
            block.createdBy?.email ??
            getCreatorInitials({
              id: createdByUserId,
              name: block.createdBy?.name ?? null,
              email: block.createdBy?.email ?? "??",
            });
          const blockTimeLabel = isExternal
            ? getBlockTimeLabel(
                date,
                block.startAt,
                block.endAt,
                timeFormat,
                timeZone,
              )
            : null;
          const blockLabel = isExternal
            ? blockTimeLabel ?? "All day"
            : block.title;
          const tooltipText = isExternal
            ? `${creatorLabel} is busy${
                block.startAt && block.endAt
                  ? ` from ${formatTimeRange(block.startAt, block.endAt, timeFormat, timeZone)}`
                  : ""
              }`
            : `${block.title}${creatorLabel ? ` | ${creatorLabel}` : ""}`;
          const notePreview = block.note?.trim();
          const blockContent = (
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={`shrink-0 rounded-full ${
                  isExternal
                    ? "h-3 w-0.5"
                    : `h-2 self-stretch ${isContinuation ? "w-1" : "w-1.5"}`
                }`}
                style={{ backgroundColor: blockAccent }}
              />
              <span
                className={`min-w-0 truncate text-[10px] ${
                  isExternal ? "font-semibold tabular-nums" : "font-medium"
                }`}
              >
                {blockLabel}
              </span>
            </div>
          );

          if (isExternal) {
            return (
              <div
                key={block.id}
                className={`rounded-lg border border-dashed px-2 py-1 ${
                  isContinuation ? "pt-1.5" : ""
                }`}
                style={{
                  backgroundColor: blockSoft,
                  backgroundImage:
                    "repeating-linear-gradient(135deg, transparent 0, transparent 4px, rgba(255,255,255,0.72) 4px, rgba(255,255,255,0.72) 7px)",
                  borderColor: `color-mix(in srgb, ${blockAccent} 28%, transparent)`,
                  color: blockText,
                }}
                title={tooltipText}
              >
                {blockContent}
              </div>
            );
          }

          if (createdByUserId === currentUserId || !isExternal) {
            return (
              <Link
                key={block.id}
                className={`rounded-lg px-2 py-1 transition hover:shadow-[var(--shadow-sm)] ${
                  isContinuation ? "pt-1.5" : ""
                }`}
                href={buildBlockEditHref(block.id)}
                style={{
                  backgroundColor: blockSoft,
                  color: blockText,
                }}
                title={notePreview ? `${tooltipText} | ${notePreview}` : tooltipText}
              >
                {blockContent}
              </Link>
            );
          }

          return (
            <div
              key={block.id}
              className={`rounded-lg px-2 py-1 opacity-90 ${isContinuation ? "pt-1.5" : ""}`}
              style={{
                backgroundColor: blockSoft,
                color: blockText,
              }}
              title={`${tooltipText} (view only)`}
            >
              {blockContent}
            </div>
          );
        })}
        {visibleEvents.map((event) => {
          const spanPosition = getEventSpanPosition(
            date,
            event.dateTimeStart,
            event.dateTimeEnd,
            timeZone,
          );

          return (
            <EventBubble
              key={event.id}
              href={`/events/${event.id}`}
              title={event.title}
              isPast={(event.dateTimeEnd ?? event.dateTimeStart) < referenceNow}
              spanPosition={spanPosition}
              timeLabel={getEventTimeLabel(event, timeFormat, spanPosition, timeZone)}
              tooltipLabel={getEventTooltip(event, timeFormat, timeZone)}
            />
          );
        })}
        {hiddenCount > 0 ? (
          <details className="group/more relative">
            <summary
              className="flex cursor-pointer list-none items-center justify-center gap-1 rounded-md border border-dashed border-[var(--panel-border)] bg-white/70 px-2 py-1 text-center text-[10px] font-semibold text-[var(--text-muted)] transition hover:border-rose-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 [&::-webkit-details-marker]:hidden"
              aria-label={`Show ${hiddenCount} more ${hiddenCount === 1 ? "item" : "items"}`}
            >
              +{hiddenCount} more
              <span
                aria-hidden="true"
                className="transition group-open/more:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="absolute inset-x-0 bottom-full z-30 mb-1 space-y-1 rounded-xl border border-[var(--panel-border)] bg-white p-1.5 text-left shadow-[var(--shadow-lg)]">
              {hiddenBlocks.map((block) => {
                const isExternal = block.source === "GOOGLE";
                const createdByUserId = block.createdByUserId || "external";
                const creatorAccent = memberVisuals[createdByUserId]?.accent;
                const blockAccent =
                  creatorAccent?.accent ?? "var(--color-secondary)";
                const blockSoft =
                  creatorAccent?.accentSoft ?? "var(--color-secondary-soft)";
                const blockText =
                  creatorAccent?.accentText ?? "var(--idea-new-text)";
                const blockTimeLabel = isExternal
                  ? getBlockTimeLabel(
                      date,
                      block.startAt,
                      block.endAt,
                      timeFormat,
                      timeZone,
                    )
                  : null;
                const label = isExternal
                  ? blockTimeLabel ?? "All day"
                  : block.title;
                const content = (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-3 w-0.5 shrink-0 rounded-full"
                      style={{ backgroundColor: blockAccent }}
                    />
                    <span className="min-w-0 truncate text-[10px] font-semibold tabular-nums">
                      {label}
                    </span>
                  </span>
                );

                return isExternal ? (
                  <div
                    key={block.id}
                    className="rounded-lg border border-dashed px-2 py-1.5"
                    style={{
                      backgroundColor: blockSoft,
                      backgroundImage:
                        "repeating-linear-gradient(135deg, transparent 0, transparent 4px, rgba(255,255,255,0.72) 4px, rgba(255,255,255,0.72) 7px)",
                      borderColor: `color-mix(in srgb, ${blockAccent} 28%, transparent)`,
                      color: blockText,
                    }}
                    title={blockTimeLabel ? `${blockTimeLabel} busy` : "All-day busy"}
                  >
                    {content}
                  </div>
                ) : (
                  <Link
                    key={block.id}
                    className="block rounded-lg px-2 py-1.5 transition hover:brightness-95"
                    href={buildBlockEditHref(block.id)}
                    style={{ backgroundColor: blockSoft, color: blockText }}
                    title={label}
                  >
                    {content}
                  </Link>
                );
              })}
              {hiddenEvents.map((event) => {
                const spanPosition = getEventSpanPosition(
                  date,
                  event.dateTimeStart,
                  event.dateTimeEnd,
                  timeZone,
                );
                const timeLabel = getEventTimeLabel(
                  event,
                  timeFormat,
                  spanPosition,
                  timeZone,
                );

                return (
                  <Link
                    key={event.id}
                    className="flex min-w-0 items-center gap-1.5 rounded-lg bg-rose-50 px-2 py-1.5 text-rose-700 transition hover:bg-rose-100"
                    href={`/events/${event.id}`}
                    title={getEventTooltip(event, timeFormat, timeZone)}
                  >
                    <span className="h-4 w-0.5 shrink-0 rounded-full bg-rose-500" />
                    {timeLabel ? (
                      <span className="shrink-0 text-[9px] font-semibold text-current/70">
                        {timeLabel}
                      </span>
                    ) : null}
                    <span className="min-w-0 truncate text-[10px] font-medium">
                      {event.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </details>
        ) : null}
      </div>
      <span className="pointer-events-none absolute bottom-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/90 bg-white/80 text-[10px] font-semibold text-[var(--text-muted)] opacity-0 transition group-hover/day:opacity-100">
        +
      </span>
    </div>
  );
}
