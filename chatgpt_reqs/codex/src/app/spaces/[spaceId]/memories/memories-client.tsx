"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import TagBadge from "@/components/ui/TagBadge";

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="1.5" />
    <path d="M8 3v4M16 3v4M3 10h18" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TagIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M20 10.5 13.5 4H6a2 2 0 0 0-2 2v7.5L10.5 20a2 2 0 0 0 2.8 0l6.7-6.7a2 2 0 0 0 0-2.8Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="7.5" r="1.5" strokeWidth="1.5" />
  </svg>
);

type Memory = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: string;
  tags: string[];
  coverUrl: string | null;
};

type MemoriesClientProps = {
  memories: Memory[];
  spaceId: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TAG_GRADIENTS: Record<string, string> = {
  date: "from-rose-500 to-pink-600",
  together: "from-rose-500 to-pink-600",
  cozy: "from-orange-400 to-amber-500",
  weekend: "from-purple-400 to-indigo-500",
};

export default function MemoriesClient({ memories, spaceId }: MemoriesClientProps) {
  const [year, setYear] = useState("all");
  const [tag, setTag] = useState("all");

  const years = useMemo(
    () =>
      Array.from(
        new Set(memories.map((event) => new Date(event.dateTimeStart).getFullYear())),
      ).sort((a, b) => b - a),
    [memories],
  );
  const tags = useMemo(
    () =>
      Array.from(new Set(memories.flatMap((event) => event.tags))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [memories],
  );

  const filtered = memories.filter((event) => {
    const matchesYear =
      year === "all" ||
      new Date(event.dateTimeStart).getFullYear().toString() === year;
    const matchesTag = tag === "all" || event.tags.includes(tag);
    return matchesYear && matchesTag;
  });

  return (
    <>
      <section className="surface p-6 bg-[var(--color-accent-soft)]/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Memories
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Revisit past dates and highlights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex h-10 items-center">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
              <select
                className="h-10 rounded-full border border-[var(--panel-border)] bg-white/80 py-2 pl-10 pr-3 text-sm leading-none text-[var(--text-primary)] shadow-sm outline-none focus:border-rose-300"
                onChange={(event) => setYear(event.target.value)}
                value={year}
              >
                <option value="all">All years</option>
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex h-10 items-center">
              <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-strong)]" />
              <select
                className="h-10 rounded-full border border-[var(--panel-border)] bg-white/80 py-2 pl-10 pr-3 text-sm leading-none text-[var(--text-primary)] shadow-sm outline-none focus:border-rose-300"
                onChange={(event) => setTag(event.target.value)}
                value={tag}
              >
                <option value="all">All tags</option>
                {tags.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>
      {filtered.length === 0 ? (
        <div className="surface p-6">
          <p className="text-sm text-[var(--text-muted)]">
            No memories match these filters yet.
          </p>
        </div>
      ) : null}
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {filtered.map((event) => {
          const gradient =
            event.tags
              .map((value) => TAG_GRADIENTS[value.toLowerCase()])
              .find(Boolean) ?? "from-rose-500 to-pink-600";
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}?from=memories&spaceId=${encodeURIComponent(spaceId)}`}
              className="group surface flex min-h-[156px] flex-col gap-4 p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg md:flex-row md:items-center"
            >
              <div
                className="relative flex h-[120px] w-[120px] min-h-[120px] min-w-[120px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-4xl font-semibold text-white shadow-sm"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0, rgba(255,255,255,0) 60%)" }} />
                {event.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={event.title}
                    className="relative z-10 h-full w-full object-cover"
                    src={event.coverUrl}
                  />
                ) : (
                  <span className="relative z-10">
                    {event.title.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
                    {event.title}
                  </h2>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] shadow-sm">
                    {formatDate(event.dateTimeStart)}
                  </span>
                </div>
                {event.description ? (
                  <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                    {event.description}
                  </p>
                ) : null}
                {event.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.tags.map((value) => (
                      <TagBadge key={value} label={value} />
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
