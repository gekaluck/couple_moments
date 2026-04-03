import Link from "next/link";

import { CalendarTimeFormat, formatEventTime } from "@/lib/calendar";
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
  events: EventSummary[];
  blocks: BlockSummary[];
  timeFormat: CalendarTimeFormat;
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
): "single" | "start" | "middle" | "end" {
  const day = getDayStart(currentDay).getTime();
  const startDay = getDayStart(startAt).getTime();
  const endDay = getDayStart(endAt ?? startAt).getTime();

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
) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: timeFormat === "12h",
  });

  return `${formatter.format(startAt)} to ${formatter.format(endAt)}`;
}

function getEventTimeLabel(
  event: EventSummary,
  timeFormat: CalendarTimeFormat,
  spanPosition: "single" | "start" | "middle" | "end",
) {
  if (!event.timeIsSet) {
    return spanPosition === "middle" ? "Continues" : "Anytime";
  }

  if (spanPosition === "single") {
    return formatEventTime(event.dateTimeStart, timeFormat);
  }

  if (spanPosition === "start") {
    return `Starts ${formatEventTime(event.dateTimeStart, timeFormat)}`;
  }

  if (spanPosition === "end" && event.dateTimeEnd) {
    return `Ends ${formatEventTime(event.dateTimeEnd, timeFormat)}`;
  }

  return "Continues";
}

function getEventTooltip(
  event: EventSummary,
  timeFormat: CalendarTimeFormat,
) {
  if (!event.timeIsSet) {
    return event.title;
  }

  const range = event.dateTimeEnd
    ? formatTimeRange(event.dateTimeStart, event.dateTimeEnd, timeFormat)
    : formatEventTime(event.dateTimeStart, timeFormat);

  return `${event.title} | ${range}`;
}

export default function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isPast,
  isWeekend,
  isCompact,
  events,
  blocks,
  timeFormat,
  addEventHref,
  currentUserId,
  memberVisuals,
  buildBlockEditHref,
  referenceNow,
}: DayCellProps) {
  const dayCellBase = isCompact
    ? "min-h-[48px] p-1.5 sm:min-h-[104px] sm:p-2"
    : "min-h-[48px] p-1.5 sm:min-h-[136px] sm:p-2.5";
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

  return (
    <div
      className={`group/day relative rounded-2xl border text-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] ${dayCellBase} ${
        isCurrentMonth
          ? inMonthTone
          : "border-[var(--panel-border)] bg-[var(--surface-50)] text-[var(--surface-400)] opacity-55"
      } ${isPast ? "opacity-65" : ""}`}
    >
      <Link
        aria-label={`Add event on ${date.toDateString()}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/35"
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
            className="inline-flex items-center rounded-full border border-[var(--panel-border)] bg-white/88 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]"
            title={countLabel}
          >
            {totalItems}
          </span>
        ) : null}
      </div>
      <div className="relative z-10 mt-2.5 hidden flex-col gap-1.5 sm:flex">
        {blocks.map((block) => {
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
          const blockLabel = isExternal ? "Busy" : block.title;
          const tooltipText = isExternal
            ? `${creatorLabel} is busy${
                block.startAt && block.endAt
                  ? ` from ${formatTimeRange(block.startAt, block.endAt, timeFormat)}`
                  : ""
              }`
            : `${block.title}${creatorLabel ? ` | ${creatorLabel}` : ""}`;
          const notePreview = block.note?.trim();
          const blockContent = (
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 self-stretch rounded-full ${isContinuation ? "w-1" : "w-1.5"}`}
                style={{ backgroundColor: blockAccent }}
              />
              <div className="min-w-0">
                <div className="truncate text-[10px] font-medium">{blockLabel}</div>
                {notePreview ? (
                  <div className="truncate text-[9px] text-current/75">
                    {notePreview}
                  </div>
                ) : null}
              </div>
            </div>
          );

          if (isExternal) {
            return (
              <div
                key={block.id}
                className={`rounded-lg border border-dashed border-white/80 px-2 py-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] ${
                  isContinuation ? "pt-1.5" : ""
                }`}
                style={{
                  backgroundColor: blockSoft,
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
        {events.map((event) => {
          const spanPosition = getEventSpanPosition(
            date,
            event.dateTimeStart,
            event.dateTimeEnd,
          );

          return (
            <EventBubble
              key={event.id}
              href={`/events/${event.id}`}
              title={event.title}
              isPast={(event.dateTimeEnd ?? event.dateTimeStart) < referenceNow}
              spanPosition={spanPosition}
              timeLabel={getEventTimeLabel(event, timeFormat, spanPosition)}
              tooltipLabel={getEventTooltip(event, timeFormat)}
            />
          );
        })}
      </div>
      <span className="pointer-events-none absolute bottom-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/90 bg-white/80 text-[10px] font-semibold text-[var(--text-muted)] opacity-0 transition group-hover/day:opacity-100">
        +
      </span>
    </div>
  );
}
