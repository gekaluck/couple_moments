import Link from "next/link";

import EventBubble from "./event-bubble";
import { CreatorAccent, getCreatorInitials } from "@/lib/creator-colors";

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
  addEventHref: string;
  creatorPalette: Map<string, CreatorAccent>;
  buildBlockEditHref: (blockId: string) => string;
};

function formatTimeLabel(value: Date) {
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const period = hours >= 12 ? "pm" : "am";
  const hour = hours % 12 || 12;
  return minutes === 0 ? `${hour}${period}` : `${hour}:${minutes.toString().padStart(2, "0")}${period}`;
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
  addEventHref,
  creatorPalette,
  buildBlockEditHref,
}: DayCellProps) {
  const maxEvents = isCompact ? 2 : 3;
  const maxBlocks = isCompact ? 1 : 2;
  const visibleEvents = events.slice(0, maxEvents);
  const overflowCount = Math.max(events.length - maxEvents, 0);
  const visibleBlocks = blocks.slice(0, maxBlocks);
  const overflowBlocks = Math.max(blocks.length - maxBlocks, 0);
  const dayCellBase = isCompact ? "min-h-[104px] p-2" : "min-h-[136px] p-2.5";
  const today = new Date();
  const hasEvents = events.length > 0;
  const hasBlocks = blocks.length > 0;
  const inMonthTone = isToday
    ? "border-[var(--action-primary)] bg-[linear-gradient(175deg,rgba(255,255,255,0.96),rgba(255,236,244,0.82))] ring-2 ring-[var(--action-primary)]/15"
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
          {isToday ? (
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
              Today
            </span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          {hasEvents ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-rose-700">
              Plans {events.length}
            </span>
          ) : null}
          {hasBlocks ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-amber-700">
              Busy {blocks.length}
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
        {visibleEvents.map((event) => (
          <EventBubble
            key={event.id}
            href={`/events/${event.id}`}
            title={event.title}
            isPast={event.dateTimeStart < today}
          />
        ))}
        {overflowCount > 0 ? (
          <div className="rounded-lg border border-dashed border-rose-200 bg-white/75 px-2 py-1 text-[10px] font-medium text-rose-700">
            +{overflowCount} more plans
          </div>
        ) : null}

        {visibleBlocks.map((block) => {
          const isExternal = block.source === "GOOGLE";
          const createdByUserId = block.createdByUserId || "external";
          const blockAccent =
            creatorPalette.get(createdByUserId)?.accent ??
            (isExternal ? "#64748b" : "var(--accent-secondary)");
          const blockSoft =
            creatorPalette.get(createdByUserId)?.accentSoft ??
            (isExternal ? "#f1f5f9" : "#fef3c7");
          const blockText =
            creatorPalette.get(createdByUserId)?.accentText ??
            (isExternal ? "#475569" : "#b45309");

          const timeLabel = isExternal && block.startAt && block.endAt
            ? `${formatTimeLabel(new Date(block.startAt))}-${formatTimeLabel(new Date(block.endAt))}`
            : null;

          const tooltipText = isExternal && block.startAt && block.endAt
            ? `Busy: ${formatTimeLabel(new Date(block.startAt))} - ${formatTimeLabel(new Date(block.endAt))}`
            : block.title;

          const initials = isExternal ? "G" : getCreatorInitials({
            id: createdByUserId,
            name: block.createdBy?.name ?? null,
            email: block.createdBy?.email ?? "??",
          });

          const blockContent = (
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1 truncate">
                {isExternal ? (
                  <span className="truncate text-[10px] font-semibold uppercase tracking-[0.06em]">
                    {timeLabel}
                  </span>
                ) : (
                  <>
                    <svg
                      aria-hidden="true"
                      className="h-3 w-3 flex-shrink-0 opacity-80"
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
                    <span className="truncate text-[10px] font-medium">{block.title}</span>
                  </>
                )}
              </span>
              <span
                className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                style={{ backgroundColor: blockAccent }}
              >
                {initials}
              </span>
            </div>
          );

          return isExternal ? (
            <div
              key={block.id}
              className="group relative rounded-lg border border-dashed px-2 py-1"
              style={{
                borderColor: blockAccent,
                backgroundColor: blockSoft,
                color: blockText,
              }}
              title={tooltipText}
            >
              {blockContent}
            </div>
          ) : (
            <Link
              key={block.id}
              className="rounded-lg border border-dashed px-2 py-1 transition hover:shadow-[var(--shadow-sm)]"
              href={buildBlockEditHref(block.id)}
              style={{
                borderColor: blockAccent,
                backgroundColor: blockSoft,
                color: blockText,
              }}
            >
              {blockContent}
            </Link>
          );
        })}

        {overflowBlocks > 0 ? (
          <div className="rounded-lg border border-dashed border-amber-200 bg-white/75 px-2 py-1 text-[10px] font-medium text-amber-700">
            +{overflowBlocks} more busy slots
          </div>
        ) : null}
      </div>
      <span className="pointer-events-none absolute bottom-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/90 bg-white/80 text-[10px] font-semibold text-[var(--text-muted)] opacity-0 transition group-hover/day:opacity-100">
        +
      </span>
    </div>
  );
}
