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
          const isExternal = block.source === 'GOOGLE';
          const createdByUserId = block.createdByUserId || 'external';
          const blockAccent =
            creatorPalette.get(createdByUserId)?.accent ??
            (isExternal ? "#64748b" : "var(--accent-secondary)");
          const blockSoft =
            creatorPalette.get(createdByUserId)?.accentSoft ??
            (isExternal ? "#f1f5f9" : "#fef3c7");
          const blockText =
            creatorPalette.get(createdByUserId)?.accentText ??
            (isExternal ? "#475569" : "#b45309");

          // Format time for external blocks
          const formatTime = (d: Date) => {
            const h = d.getHours();
            const m = d.getMinutes();
            const ampm = h >= 12 ? 'pm' : 'am';
            const hour = h % 12 || 12;
            return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
          };

          const timeLabel = isExternal && block.startAt && block.endAt
            ? `${formatTime(new Date(block.startAt))}-${formatTime(new Date(block.endAt))}`
            : null;

          const tooltipText = isExternal && block.startAt && block.endAt
            ? `Busy: ${formatTime(new Date(block.startAt))} - ${formatTime(new Date(block.endAt))}`
            : block.title;

          const initials = isExternal ? "G" : getCreatorInitials({
            id: createdByUserId,
            name: block.createdBy?.name ?? null,
            email: block.createdBy?.email ?? "??",
          });

          const blockContent = (
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1 truncate font-medium">
                {isExternal ? (
                  <span className="truncate">{timeLabel}</span>
                ) : (
                  <>
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
              className="group relative rounded-lg border-2 border-dashed px-2 py-1 text-[11px]"
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
              className="rounded-lg border-2 border-dashed px-2 py-1 text-xs transition hover:shadow-[var(--shadow-sm)] opacity-80"
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
        {visibleEvents.map((event) => (
          <EventBubble
            key={event.id}
            href={`/events/${event.id}`}
            title={event.title}
            isPast={event.dateTimeStart < today}
          />
        ))}
        {overflowCount > 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--panel-border)] px-2 py-1 text-[10px] text-[var(--text-muted)]">
            ... +{overflowCount} more
          </div>
        ) : null}
      </div>
    </div>
  );
}
