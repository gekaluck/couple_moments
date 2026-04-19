"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Calendar,
  Camera,
  Heart,
  Lightbulb,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";

import type { CalendarTimeFormat } from "@/lib/calendar";
import type { ActivityType } from "@/lib/activity";
import type { CreatorVisualMap } from "@/lib/creator-colors";
import LocalTime, { formatRelativeDayLabel } from "@/components/time/LocalTime";
import EmptyState from "@/components/ui/EmptyState";

type ActivityEntry = {
  id: string;
  type: ActivityType;
  createdAt: string;
  actorId: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
  };
  target: {
    kind: "event" | "idea" | "memory";
    id: string;
    title: string;
    href: string;
  } | null;
  body: string | null;
  memory: {
    rating: number;
    photoCount: number;
    heroPhotoUrl: string | null;
  } | null;
  photos: { url: string; alt?: string | null }[] | null;
  relatedIdea: { title: string } | null;
};

type ActivityFeedProps = {
  entries: ActivityEntry[];
  timeFormat?: CalendarTimeFormat;
  spaceId: string;
  currentUserId: string;
  memberVisuals: CreatorVisualMap;
  totalCount: number;
};

type FilterKey = "all" | "plans" | "ideas" | "memories" | "photos" | "notes";

type ActivityPresentation = {
  eyebrow: string;
  iconColorClass: string;
  eyebrowColorClass: string;
  icon: typeof Calendar;
};

const ACTIVITY_PRESENTATION: Record<ActivityType, ActivityPresentation> = {
  event_created: {
    eyebrow: "PLANNED",
    iconColorClass: "text-rose-600",
    eyebrowColorClass: "text-rose-700",
    icon: Calendar,
  },
  event_updated: {
    eyebrow: "UPDATED",
    iconColorClass: "text-rose-600",
    eyebrowColorClass: "text-rose-700",
    icon: Calendar,
  },
  idea_saved: {
    eyebrow: "NEW IDEA",
    iconColorClass: "text-amber-600",
    eyebrowColorClass: "text-amber-700",
    icon: Lightbulb,
  },
  idea_promoted: {
    eyebrow: "MOVED TO CALENDAR",
    iconColorClass: "text-amber-600",
    eyebrowColorClass: "text-amber-700",
    icon: Sparkles,
  },
  comment_added: {
    eyebrow: "NOTED",
    iconColorClass: "text-teal-600",
    eyebrowColorClass: "text-teal-700",
    icon: MessageCircle,
  },
  memory_completed: {
    eyebrow: "REMEMBERED",
    iconColorClass: "text-rose-600",
    eyebrowColorClass: "text-rose-700",
    icon: Heart,
  },
  photo_added: {
    eyebrow: "ADDED PHOTOS",
    iconColorClass: "text-violet-600",
    eyebrowColorClass: "text-violet-700",
    icon: Camera,
  },
};

const FILTERS: { key: FilterKey; label: string; matches: (type: ActivityType) => boolean }[] = [
  { key: "all", label: "All", matches: () => true },
  {
    key: "plans",
    label: "Plans",
    matches: (type) => type === "event_created" || type === "event_updated",
  },
  { key: "ideas", label: "Ideas", matches: (type) => type === "idea_saved" },
  {
    key: "memories",
    label: "Memories",
    matches: (type) => type === "memory_completed" || type === "idea_promoted",
  },
  { key: "photos", label: "Photos", matches: (type) => type === "photo_added" },
  { key: "notes", label: "Notes", matches: (type) => type === "comment_added" },
];

const LAST_SEEN_STORAGE_PREFIX = "cm_activity_last_seen_v1:";

function subscribe() {
  return () => {};
}

function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readLastSeen(storageKey: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(storageKey);
}

function toLocalDayKey(iso: string, hasHydrated: boolean) {
  return hasHydrated ? new Date(iso).toLocaleDateString("en-CA") : iso.slice(0, 10);
}

function groupByDay(entries: ActivityEntry[], hasHydrated: boolean) {
  const map = new Map<string, ActivityEntry[]>();
  for (const entry of entries) {
    const key = toLocalDayKey(entry.createdAt, hasHydrated);
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => ({
      key,
      items: items
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    }));
}

function HeartRatingDots({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, value));
  return (
    <span
      aria-label={`Rated ${filled} out of 5`}
      className="inline-flex items-center gap-0.5"
      role="img"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Heart
          key={index}
          aria-hidden="true"
          className={`h-3 w-3 ${
            index < filled ? "fill-rose-500 text-rose-500" : "text-[var(--text-tertiary)]"
          }`}
        />
      ))}
    </span>
  );
}

function DayHeader({ entries }: { entries: ActivityEntry[] }) {
  const first = entries[0];
  if (!first) return null;
  return (
    <div className="sticky top-[88px] z-20 mb-2 flex items-baseline gap-2 bg-[var(--background)]/85 px-1 pb-2 pt-4 backdrop-blur-sm">
      <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--text-primary)]">
        {formatRelativeDayLabel(first.createdAt)}
      </h2>
      <span className="text-xs text-[var(--text-muted)]">
        <LocalTime
          options={{ month: "short", day: "numeric" }}
          value={first.createdAt}
        />
      </span>
    </div>
  );
}

type ActivityRowProps = {
  entry: ActivityEntry;
  memberVisuals: CreatorVisualMap;
  timeFormat: CalendarTimeFormat;
  currentUserId: string;
  isUnseen: boolean;
};

function ActivityRow({
  entry,
  memberVisuals,
  timeFormat,
  currentUserId,
  isUnseen,
}: ActivityRowProps) {
  const presentation = ACTIVITY_PRESENTATION[entry.type];
  const Icon = presentation.icon;
  const visual = memberVisuals[entry.actorId];
  const accentHex = visual?.accent.accent ?? "#d94f5c";
  const actorLabel =
    entry.actorId === currentUserId
      ? `${visual?.displayName ?? "You"} (you)`
      : visual?.displayName ??
        entry.actor.name ??
        entry.actor.email;
  const title = entry.target?.title ?? "";
  const href = entry.target?.href ?? null;

  const ariaLabel = `${actorLabel} ${presentation.eyebrow.toLowerCase()} ${title}`.trim();

  const content = (
    <article
      aria-label={ariaLabel}
      className="group relative overflow-hidden rounded-[10px] border border-[var(--panel-border)] bg-white px-3.5 py-3 transition-colors hover:bg-[var(--surface-50)] md:px-4"
      style={{ borderLeft: `3px solid ${accentHex}` }}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase leading-tight tracking-[0.05em]">
        <Icon
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${presentation.iconColorClass}`}
        />
        <span className={presentation.eyebrowColorClass}>
          {presentation.eyebrow}
        </span>
        <span aria-hidden="true" className="text-[var(--text-tertiary)]">
          ·
        </span>
        <span style={{ color: accentHex }}>{actorLabel}</span>
        {isUnseen ? (
          <span
            aria-label="New since your last visit"
            className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-rose-500"
            role="img"
          />
        ) : null}
        <LocalTime
          className="ml-auto rounded-full border border-[var(--panel-border)] bg-white px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          options={{ hour: "numeric", minute: "2-digit" }}
          timeFormat={timeFormat}
          value={entry.createdAt}
        />
      </div>

      {title ? (
        <p className="mt-1 text-[15px] font-semibold tracking-[-0.005em] text-[var(--text-primary)] md:text-base">
          {title}
        </p>
      ) : null}

      {entry.type === "idea_promoted" && entry.relatedIdea ? (
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          From idea: <span className="italic">{entry.relatedIdea.title}</span>
        </p>
      ) : null}

      {entry.body ? (
        <p className="mt-1.5 max-w-3xl whitespace-pre-wrap text-[13px] leading-[1.5] text-[var(--text-secondary)]">
          {entry.body}
        </p>
      ) : null}

      {entry.memory ? (
        <div className="mt-2.5 flex items-start gap-2.5 rounded-lg bg-rose-50/70 p-2">
          {entry.memory.heroPhotoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt=""
              className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
              src={entry.memory.heroPhotoUrl}
            />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <HeartRatingDots value={entry.memory.rating} />
            {entry.memory.photoCount > 0 ? (
              <p className="text-[9.5px] font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                {entry.memory.photoCount}{" "}
                {entry.memory.photoCount === 1 ? "photo" : "photos"}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {entry.photos && entry.photos.length > 0 ? (
        <div className="mt-2.5 flex gap-1.5">
          {entry.photos.slice(0, 3).map((photo, index) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt={photo.alt ?? ""}
              className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
              key={`${entry.id}-photo-${index}`}
              src={photo.url}
            />
          ))}
        </div>
      ) : null}
    </article>
  );

  return href ? (
    <Link className="block" href={href}>
      {content}
    </Link>
  ) : (
    content
  );
}

function ActivityEmptyState({ spaceId }: { spaceId: string }) {
  return (
    <div className="surface flex flex-col items-center gap-5 p-8 text-center">
      <div className="relative h-28 w-40" aria-hidden="true">
        <span className="absolute left-2 top-6 block h-20 w-28 rotate-[-6deg] rounded-2xl bg-rose-100" />
        <span className="absolute left-6 top-3 block h-20 w-28 rotate-[4deg] rounded-2xl bg-amber-100" />
        <span className="absolute left-4 top-1 flex h-20 w-28 -rotate-[1deg] items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-white shadow-sm">
          <Heart className="h-8 w-8 fill-rose-500 text-rose-500" />
        </span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-600">
          Nothing yet
        </p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Your story starts here.
        </h3>
        <p className="mx-auto mt-2 max-w-[280px] text-sm text-[var(--text-muted)]">
          Plan a date, save an idea, or upload a memory — we&apos;ll keep it
          all here for the two of you.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          href={`/spaces/${spaceId}/calendar`}
        >
          Plan a date
        </Link>
        <Link
          className="rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:shadow-sm"
          href={`/spaces/${spaceId}/calendar`}
        >
          Save an idea
        </Link>
      </div>
    </div>
  );
}

export default function ActivityFeed({
  entries,
  timeFormat = "24h",
  spaceId,
  currentUserId,
  memberVisuals,
  totalCount,
}: ActivityFeedProps) {
  const hasHydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const storageKey = `${LAST_SEEN_STORAGE_PREFIX}${spaceId}:${currentUserId}`;
  // useSyncExternalStore only re-snapshots on subscribe events; same-tab writes
  // don't fire `storage`, so the dot stays visible for the whole session.
  const lastSeenIso = useSyncExternalStore(
    subscribeToStorage,
    () => readLastSeen(storageKey),
    () => null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const newest = entries[0]?.createdAt;
    if (!newest || newest === lastSeenIso) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, newest);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [entries, lastSeenIso, storageKey]);

  const filterMatcher = useMemo(
    () => FILTERS.find((filter) => filter.key === activeFilter) ?? FILTERS[0],
    [activeFilter],
  );
  const normalizedQuery = query.trim().toLowerCase();

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!filterMatcher.matches(entry.type)) {
        return false;
      }
      if (normalizedQuery.length === 0) {
        return true;
      }
      const haystack = `${entry.target?.title ?? ""} ${entry.body ?? ""} ${entry.relatedIdea?.title ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [entries, filterMatcher, normalizedQuery]);

  const grouped = useMemo(
    () => groupByDay(filteredEntries, hasHydrated),
    [filteredEntries, hasHydrated],
  );

  return (
    <>
      <section className="px-1 pb-3 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Activity
        </p>
        <h1 className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-[var(--text-primary)] md:text-[28px]">
          What you&apos;ve been up to
        </h1>
        <p className="mt-1 hidden text-sm text-[var(--text-muted)] md:block">
          Every plan, idea, and memory across your space.
        </p>
      </section>

      <section className="mb-4 flex flex-col gap-3 px-1">
        <div
          aria-label="Activity type filter"
          className="-mx-1 flex gap-1.5 overflow-x-auto scrollbar-none px-1 pb-1"
          role="tablist"
        >
          {FILTERS.map((filter) => {
            const active = filter.key === activeFilter;
            return (
              <button
                aria-selected={active}
                className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                    : "border-[var(--panel-border)] bg-white text-[var(--text-secondary)] hover:border-rose-300 hover:text-[var(--text-primary)]"
                }`}
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                role="tab"
                type="button"
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <label className="relative hidden items-center md:flex">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--text-tertiary)]"
          />
          <input
            aria-label="Search activity"
            className="w-full rounded-full border border-[var(--panel-border)] bg-white py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-rose-400"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activity..."
            type="search"
            value={query}
          />
        </label>
      </section>

      {totalCount === 0 ? (
        <ActivityEmptyState spaceId={spaceId} />
      ) : filteredEntries.length === 0 ? (
        <div className="surface p-6">
          <EmptyState
            variant="activity"
            title="Nothing matches that filter"
            description={
              normalizedQuery
                ? "Try a different search or clear the filter."
                : "Try another filter to see more activity."
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {grouped.map((group) => (
            <div className="flex flex-col gap-2" key={group.key}>
              <DayHeader entries={group.items} />
              <div className="stagger-children flex flex-col gap-2">
                {group.items.map((entry) => {
                  const isUnseen =
                    Boolean(lastSeenIso) &&
                    entry.createdAt > (lastSeenIso ?? "") &&
                    entry.actorId !== currentUserId;
                  return (
                    <ActivityRow
                      currentUserId={currentUserId}
                      entry={entry}
                      isUnseen={isUnseen}
                      key={entry.id}
                      memberVisuals={memberVisuals}
                      timeFormat={timeFormat}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

    </>
  );
}
