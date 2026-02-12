import Link from "next/link";

import EventBubble from "./event-bubble";
import { CalendarTimeFormat, formatEventTime } from "@/lib/calendar";
import { CreatorVisualMap, getCreatorInitials } from "@/lib/creator-colors";

type EventSummary = {
  id: string;
  title: string;
  dateTimeStart: Date;
};

type BlockSummary = {
  id: string;
  title: string;
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
  nowLabel: string;
  timeFormat: CalendarTimeFormat;
  addEventHref: string;
  currentUserId: string;
  memberVisuals: CreatorVisualMap;
  buildBlockEditHref: (blockId: string) => string;
};

function formatTimeLabel(value: Date, timeFormat: CalendarTimeFormat) {
  return formatEventTime(value, timeFormat)
    .replace(/\s+/g, "")
    .toLowerCase();
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
  nowLabel,
  timeFormat,
  addEventHref,
  currentUserId,
  memberVisuals,
  buildBlockEditHref,
}: DayCellProps) {
  const visibleEvents = events;
  const visibleBlocks = blocks;
  const dayCellBase = isCompact ? "min-h-[104px] p-2" : "min-h-[136px] p-2.5";
  const today = new Date();
  const hasEvents = events.length > 0;
  const now = new Date();
  const hasUpcomingPlans = events.some((event) => event.dateTimeStart >= now);
  const hasMemories = events.some((event) => event.dateTimeStart < now);
  const hasBusyTime = blocks.length > 0;
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
  const hasAnyDots = hasUpcomingPlans || hasMemories || hasBusyTime;

  return (
    <div
      className={`group/day relative rounded-2xl border text-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] ${dayCellBase} ${
        isCurrentMonth ? inMonthTone : "border-[var(--panel-border)] bg-[var(--surface-50)] text-[var(--surface-400)] opacity-55"
      } ${isPast ? "opacity-65" : ""}`}
    >
      <Link
        aria-label={`Add event on ${date.toDateString()}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/35"
        href={addEventHref}
      />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${datePillClass}`}>
            {date.getDate()}
          </span>
        </div>
        <div className="flex min-h-6 items-center">
          {hasAnyDots ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--panel-border)] bg-white/85 px-1.5 py-1">
              {hasUpcomingPlans ? (
                <span
                  className="h-2 w-2 rounded-full bg-rose-500"
                />
              ) : null}
              {hasMemories ? <span className="h-2 w-2 rounded-full bg-[#8b9daf]" /> : null}
              {hasBusyTime ? <span className="h-2 w-2 rounded-full bg-amber-500" /> : null}
            </span>
          ) : null}
        </div>
      </div>
      {isToday ? (
        <div className="relative z-10 mt-1 inline-flex items-center gap-1.5 text-[9px] font-medium text-[var(--text-tertiary)]">
          <span className="h-1 w-1 rounded-full bg-rose-400" />
          {nowLabel}
        </div>
      ) : null}
      <div className="relative z-10 mt-2.5 flex flex-col gap-1.5">
        {visibleBlocks.map((block) => {
          const isExternal = block.source === "GOOGLE";
          const createdByUserId = block.createdByUserId || "external";
          const blockAccent = "var(--color-secondary)";
          const blockSoft = "var(--color-secondary-soft)";
          const blockText = "var(--idea-new-text)";

          const currentDay = new Date(date);
          currentDay.setHours(0, 0, 0, 0);
          const blockStartDay = block.startAt ? new Date(block.startAt) : null;
          const blockEndDay = block.endAt ? new Date(block.endAt) : null;
          if (blockStartDay) {
            blockStartDay.setHours(0, 0, 0, 0);
          }
          if (blockEndDay) {
            blockEndDay.setHours(0, 0, 0, 0);
          }
          const isMultiDay = Boolean(
            blockStartDay && blockEndDay && blockStartDay < blockEndDay,
          );
          const isStartDay = Boolean(
            blockStartDay && blockStartDay.getTime() === currentDay.getTime(),
          );
          const isContinuation = isMultiDay && !isStartDay;
          const useThinBar = (isExternal && isMultiDay) || isContinuation;

          const timeLabel =
            isExternal && block.startAt && block.endAt
              ? `${formatTimeLabel(new Date(block.startAt), timeFormat)}-${formatTimeLabel(new Date(block.endAt), timeFormat)}`
              : null;

          const tooltipText = isExternal && block.startAt && block.endAt
            ? `Busy: ${formatTimeLabel(new Date(block.startAt), timeFormat)} - ${formatTimeLabel(new Date(block.endAt), timeFormat)}`
            : block.title;
          const creatorInitials =
            memberVisuals[createdByUserId]?.initials ??
            getCreatorInitials({
              id: createdByUserId,
              name: block.createdBy?.name ?? null,
              email: block.createdBy?.email ?? "??",
            });

          const blockContent = useThinBar ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: blockAccent }} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                {creatorInitials}
              </span>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: blockAccent }}
              />
              <span className="truncate text-[10px] font-medium">
                {isExternal ? timeLabel ?? "Busy" : block.title}
              </span>
              <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                {creatorInitials}
              </span>
            </div>
          );

          return isExternal ? (
            <div
              key={block.id}
              className={`relative rounded-lg px-2 py-1 ${isContinuation ? "pt-1.5" : ""}`}
              style={{
                backgroundColor: blockSoft,
                color: blockText,
              }}
              title={tooltipText}
            >
              {blockContent}
            </div>
          ) : (
            createdByUserId === currentUserId ? (
              <Link
                key={block.id}
                className={`rounded-lg px-2 py-1 transition hover:shadow-[var(--shadow-sm)] ${isContinuation ? "pt-1.5" : ""}`}
                href={buildBlockEditHref(block.id)}
                style={{
                  backgroundColor: blockSoft,
                  color: blockText,
                }}
              >
                {blockContent}
              </Link>
            ) : (
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
            )
          );
        })}
        {visibleEvents.map((event) => (
          <EventBubble
            key={event.id}
            href={`/events/${event.id}`}
            title={event.title}
            isPast={event.dateTimeStart < today}
          />
        ))}
      </div>
      <span className="pointer-events-none absolute bottom-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/90 bg-white/80 text-[10px] font-semibold text-[var(--text-muted)] opacity-0 transition group-hover/day:opacity-100">
        +
      </span>
    </div>
  );
}
