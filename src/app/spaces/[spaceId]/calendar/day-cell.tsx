import Link from "next/link";

import EventBubble from "./event-bubble";
import { formatEventTime } from "@/lib/calendar";
import { CreatorAccent, getCreatorInitials } from "@/lib/creator-colors";

type EventSummary = {
  id: string;
  title: string;
  dateTimeStart: Date;
  timeIsSet: boolean;
};

type BlockSummary = {
  id: string;
  title: string;
  createdByUserId: string;
  createdBy?: { name: string | null; email: string } | null;
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
  addEventHref: string;
  creatorPalette: Map<string, CreatorAccent>;
  calendarTimeFormat: "12h" | "24h";
  buildBlockEditHref: (blockId: string) => string;
};

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
  addEventHref,
  creatorPalette,
  calendarTimeFormat,
  buildBlockEditHref,
}: DayCellProps) {
  const maxEvents = isCompact ? 2 : 3;
  const visibleEvents = events.slice(0, maxEvents);
  const overflowCount = Math.max(events.length - maxEvents, 0);
  const dayCellBase = isCompact ? "min-h-[90px] p-1.5" : "min-h-[120px] p-2";
  const today = new Date();

  return (
    <div
      className={`relative rounded-xl border text-xs transition hover:shadow-[var(--shadow-sm)] ${dayCellBase} ${
        isCurrentMonth
          ? isWeekend
            ? "bg-rose-50/50"
            : "bg-white/80"
          : "bg-[var(--surface-50)] text-[var(--surface-400)] opacity-50"
      } ${isPast ? "opacity-60" : ""} ${
        isToday ? "border-rose-400 border-2" : "border-[var(--panel-border)]"
      }`}
    >
      <Link
        aria-label={`Add event on ${date.toDateString()}`}
        className="absolute inset-0 z-0"
        href={addEventHref}
      />
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
        {date.getDate()}
        {isToday ? (
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            Today
          </span>
        ) : null}
      </div>
      {isToday ? (
        <div className="mt-1 inline-flex items-center gap-1.5 text-[9px] font-medium text-[var(--text-tertiary)]">
          <span className="h-1 w-1 rounded-full bg-rose-400" />
          {nowLabel}
        </div>
      ) : null}
      <div className="relative z-10 mt-2 flex flex-col gap-1">
        {blocks.map((block) => {
          const blockAccent =
            creatorPalette.get(block.createdByUserId)?.accent ??
            "var(--accent-secondary)";
          const blockSoft =
            creatorPalette.get(block.createdByUserId)?.accentSoft ?? "#fef3c7";
          const blockText =
            creatorPalette.get(block.createdByUserId)?.accentText ?? "#b45309";
          const initials = getCreatorInitials({
            id: block.createdByUserId,
            name: block.createdBy?.name ?? null,
            email: block.createdBy?.email ?? "??",
          });
          return (
            <Link
              key={block.id}
              className="rounded-lg border-2 border-dashed px-2 py-1 text-xs transition hover:shadow-[var(--shadow-sm)] opacity-80"
              href={buildBlockEditHref(block.id)}
              style={{
                borderColor: blockAccent,
                backgroundColor: blockSoft,
                color: blockText,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1 truncate font-semibold">
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                    <path
                      d="M12 7.5v5l3 2"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="truncate">{block.title}</span>
                </span>
                <span
                  className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: blockAccent }}
                >
                  {initials}
                </span>
              </div>
            </Link>
          );
        })}
        {visibleEvents.map((event) => {
          const eventIsPast = event.dateTimeStart < today;
          const eventTime =
            event.timeIsSet && event.dateTimeStart
              ? formatEventTime(event.dateTimeStart, calendarTimeFormat)
              : null;
          return (
            <EventBubble
              key={event.id}
              href={`/events/${event.id}`}
              title={event.title}
              timeLabel={eventTime}
              isPast={eventIsPast}
            />
          );
        })}
        {overflowCount > 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--panel-border)] px-2 py-1 text-[10px] text-[var(--text-muted)]">
            ... +{overflowCount} more
          </div>
        ) : null}
      </div>
    </div>
  );
}
