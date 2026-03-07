"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import type { CalendarTimeFormat } from "@/lib/calendar";
import LocalTime, { formatRelativeDayLabel } from "@/components/time/LocalTime";

type ActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  entityTitle: string | null;
  entityHref: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
};

type ActivityFeedProps = {
  entries: ActivityEntry[];
  timeFormat?: CalendarTimeFormat;
};

function subscribe() {
  return () => {};
}

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 text-[var(--text-tertiary)]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="1.5" />
    <path d="M8 3v4M16 3v4M3 10h18" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IdeaIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 text-[var(--text-tertiary)]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M9 18h6M10 21h4M8 14a6 6 0 1 1 8 0c-1 1-2 2-2 4h-4c0-2-1-3-2-4Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CommentIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 text-[var(--text-tertiary)]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NoteIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 text-[var(--text-tertiary)]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M7 4h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 4v4h4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function getActivityTone(entityType: string) {
  if (entityType === "EVENT") {
    return {
      chip: "border border-rose-200 bg-rose-100 text-rose-700",
      card:
        "bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(255,239,246,0.76))]",
    };
  }
  if (entityType === "IDEA") {
    return {
      chip: "border border-amber-200 bg-amber-100 text-amber-700",
      card:
        "bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(255,248,233,0.76))]",
    };
  }
  if (entityType === "COMMENT") {
    return {
      chip: "border border-sky-200 bg-sky-100 text-sky-700",
      card:
        "bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(235,246,255,0.78))]",
    };
  }
  return {
    chip: "border border-violet-200 bg-violet-100 text-violet-700",
    card:
      "bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(243,238,255,0.78))]",
  };
}

export default function ActivityFeed({
  entries,
  timeFormat = "24h",
}: ActivityFeedProps) {
  const hasHydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const grouped = entries.reduce<Map<string, ActivityEntry[]>>((acc, entry) => {
    const key = hasHydrated
      ? new Date(entry.createdAt).toLocaleDateString("en-CA")
      : entry.createdAt.slice(0, 10);
    const list = acc.get(key) ?? [];
    list.push(entry);
    acc.set(key, list);
    return acc;
  }, new Map());

  const groupedEntries = Array.from(grouped.entries()).sort((a, b) =>
    a[0] < b[0] ? 1 : -1,
  );

  return (
    <>
      {groupedEntries.map(([key, groupEntries]) => (
        <div key={key} className="stagger-children flex flex-col gap-3">
          <div className="sticky top-[88px] z-20 w-fit rounded-full border border-[var(--panel-border)] bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)] backdrop-blur-sm">
            {hasHydrated
              ? formatRelativeDayLabel(groupEntries[0].createdAt)
              : new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${key}T00:00:00.000Z`))}
          </div>
          {groupEntries
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .map((entry) => {
              const tone = getActivityTone(entry.entityType);
              return (
                <div
                  key={entry.id}
                  className={`surface relative overflow-hidden p-5 ${tone.card}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                        {entry.entityType === "EVENT" ? (
                          <CalendarIcon />
                        ) : entry.entityType === "IDEA" ? (
                          <IdeaIcon />
                        ) : entry.entityType === "COMMENT" ? (
                          <CommentIcon />
                        ) : (
                          <NoteIcon />
                        )}
                        <span>{entry.action}</span>
                        {entry.entityTitle && entry.entityHref ? (
                          <>
                            <span>:</span>
                            <Link
                              className="font-medium text-rose-600 transition hover:text-rose-700 hover:underline"
                              href={entry.entityHref}
                            >
                              {entry.entityTitle}
                            </Link>
                          </>
                        ) : null}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <span>{entry.user.name || entry.user.email}</span>
                        <span>/</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${tone.chip}`}
                        >
                          {entry.entityType.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <LocalTime
                      className="rounded-full border border-[var(--panel-border)] bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
                      options={{
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }}
                      timeFormat={timeFormat}
                      value={entry.createdAt}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      ))}
    </>
  );
}
