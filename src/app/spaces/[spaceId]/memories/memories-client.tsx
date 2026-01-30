"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import TagBadge from "@/components/ui/TagBadge";
import EmptyState from "@/components/ui/EmptyState";

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

const RepeatIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M17 1l4 4-4 4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 11V9a4 4 0 0 1 4-4h14"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 23l-4-4 4-4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 13v2a4 4 0 0 1-4 4H3"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  romantic: "from-rose-500 to-pink-600",
  anniversary: "from-rose-500 to-pink-600",
  cozy: "from-orange-400 to-amber-500",
  home: "from-orange-400 to-amber-500",
  weekend: "from-purple-400 to-indigo-500",
  outdoor: "from-emerald-500 to-teal-600",
  hiking: "from-emerald-500 to-teal-600",
  nature: "from-emerald-500 to-teal-600",
  dinner: "from-amber-500 to-orange-500",
  food: "from-amber-500 to-orange-500",
  restaurant: "from-amber-500 to-orange-500",
  movie: "from-violet-500 to-purple-600",
  concert: "from-violet-500 to-purple-600",
  travel: "from-sky-500 to-blue-600",
  trip: "from-sky-500 to-blue-600",
  vacation: "from-sky-500 to-blue-600",
};

export default function MemoriesClient({ memories, spaceId }: MemoriesClientProps) {
  const [year, setYear] = useState("all");
  const [tag, setTag] = useState("all");
  const [search, setSearch] = useState("");

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

  const filtered = memories
    .filter((event) => {
      const matchesYear =
        year === "all" ||
        new Date(event.dateTimeStart).getFullYear().toString() === year;
      const matchesTag = tag === "all" || event.tags.includes(tag);
      const matchesSearch =
        search.trim() === "" ||
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        (event.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      return matchesYear && matchesTag && matchesSearch;
    })
    .sort((a, b) => new Date(b.dateTimeStart).getTime() - new Date(a.dateTimeStart).getTime());

  return (
    <div className="page-enter-stagger">
      <section className="surface-muted p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-kicker">Memories</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Revisit your highlights
            </h2>
            <p className="section-subtitle">
              Filter by year or tag to rediscover your favorites.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex h-10 items-center">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8" strokeWidth="1.5" />
                  <path d="m21 21-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                className="h-10 w-48 rounded-full border border-[var(--panel-border)] bg-white/80 py-2 pl-10 pr-3 text-sm text-[var(--text-primary)] shadow-sm outline-none focus:border-rose-300"
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative flex h-10 items-center">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-strong)]">
                <CalendarIcon />
              </span>
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
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-strong)]">
                <TagIcon />
              </span>
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
        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            <button
              className={`rounded-full border px-3 py-1 transition ${
                tag === "all"
                  ? "border-rose-300 bg-rose-100 text-rose-700"
                  : "border-[var(--panel-border)] bg-white/70 text-[var(--text-tertiary)] hover:border-rose-300 hover:text-rose-700"
              }`}
              onClick={() => setTag("all")}
              type="button"
            >
              All
            </button>
            {tags.map((value) => (
              <button
                key={value}
                className={`rounded-full border px-3 py-1 transition ${
                  tag === value
                    ? "border-rose-300 bg-rose-100 text-rose-700"
                    : "border-[var(--panel-border)] bg-white/70 text-[var(--text-tertiary)] hover:border-rose-300 hover:text-rose-700"
                }`}
                onClick={() => setTag(value)}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
        ) : null}
      </section>
      {filtered.length === 0 ? (
        <div className="surface p-6">
          <EmptyState
            variant="memories"
            title="No memories yet"
            description={
              year !== "all" || tag !== "all" || search.trim() !== ""
                ? "No memories match these filters. Try adjusting your selection."
                : "Your shared memories will appear here after you complete dates together."
            }
          />
        </div>
      ) : null}
      <div className="stagger-children mx-auto flex max-w-4xl flex-col gap-6">
        {filtered.map((event) => {
          const gradient =
            event.tags
              .map((value) => TAG_GRADIENTS[value.toLowerCase()])
              .find(Boolean) ?? "from-slate-500 to-slate-600";
          return (
            <div
              key={event.id}
              className="group surface relative flex min-h-[156px] flex-col gap-4 p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg md:flex-row md:items-center"
            >
              <Link
                href={`/events/${event.id}?from=memories&spaceId=${encodeURIComponent(spaceId)}`}
                className="absolute inset-0 z-0"
              />
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
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/spaces/${spaceId}/calendar?repeat=${event.id}`}
                      className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600 md:opacity-100"
                      title="Do this again"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RepeatIcon />
                      <span className="hidden sm:inline">Repeat</span>
                    </Link>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] shadow-sm">
                      {formatDate(event.dateTimeStart)}
                    </span>
                  </div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
