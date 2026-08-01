"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

import EmptyState from "@/components/ui/EmptyState";
import PlanningCover from "@/components/planning/PlanningCover";
import LocalTime from "@/components/time/LocalTime";
import { loadPlacePhotoUrls } from "@/lib/place-photos-client";

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

type Memory = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: string;
  tags: string[];
  placeId: string | null;
  placeName: string | null;
  coverUrl: string | null;
  fallbackCoverUrl: string | null;
};

type MemoriesClientProps = {
  memories: Memory[];
  spaceId: string;
};

type MemoryCoverProps = {
  coverUrl: string | null;
  fallbackCoverUrl: string | null;
  placeId: string | null;
  title: string;
  children?: ReactNode;
  sizeClass?: string;
};

function MemoryCover({
  coverUrl,
  fallbackCoverUrl,
  placeId,
  title,
  children,
  sizeClass = "aspect-[16/10] w-full",
}: MemoryCoverProps) {
  const [resolvedCoverUrl, setResolvedCoverUrl] = useState<string | null>(null);
  const [dynamicCoverState, setDynamicCoverState] = useState<{
    placeId: string | null;
    url: string | null;
    loaded: boolean;
  }>({ placeId: null, url: null, loaded: false });
  const uploadedCoverCandidates = useMemo(
    () =>
      [coverUrl]
        .map((url) => url?.trim() ?? "")
        .filter(
          (url, index, list) =>
            /^https?:\/\//i.test(url) && list.indexOf(url) === index,
        ),
    [coverUrl],
  );
  const activeCoverUrl =
    resolvedCoverUrl && uploadedCoverCandidates.includes(resolvedCoverUrl)
      ? resolvedCoverUrl
      : dynamicCoverState.loaded && dynamicCoverState.placeId === placeId
        ? dynamicCoverState.url ?? fallbackCoverUrl
        : uploadedCoverCandidates[0] ?? fallbackCoverUrl;
  const isResolvingCover = Boolean(
    !resolvedCoverUrl &&
      (uploadedCoverCandidates.length > 0 || placeId) &&
      !(dynamicCoverState.loaded && dynamicCoverState.placeId === placeId),
  );

  useEffect(() => {
    let cancelled = false;

    const loadFreshFallback = async () => {
      if (!placeId) {
        if (!cancelled) {
          setResolvedCoverUrl(null);
          setDynamicCoverState({ placeId: null, url: null, loaded: true });
        }
        return;
      }
      const freshUrls = await loadPlacePhotoUrls(placeId, {
        limit: 1,
        maxWidth: 600,
        maxHeight: 600,
      }).catch(() => []);
      if (!cancelled) {
        setResolvedCoverUrl(null);
        setDynamicCoverState({ placeId, url: freshUrls[0] ?? null, loaded: true });
      }
    };

    const probe = (index: number) => {
      if (index >= uploadedCoverCandidates.length) {
        void loadFreshFallback();
        return;
      }

      const image = new Image();
      image.onload = () => {
        if (!cancelled) {
          setResolvedCoverUrl(uploadedCoverCandidates[index]);
        }
      };
      image.onerror = () => probe(index + 1);
      image.src = uploadedCoverCandidates[index];
    };

    if (uploadedCoverCandidates.length === 0) {
      void loadFreshFallback();
    } else {
      probe(0);
    }

    return () => {
      cancelled = true;
    };
  }, [placeId, uploadedCoverCandidates]);

  return (
    <PlanningCover
      src={activeCoverUrl}
      alt={`${title} cover`}
      className={sizeClass}
      isLoading={isResolvingCover}
    >
      {children}
    </PlanningCover>
  );
}

export default function MemoriesClient({ memories, spaceId }: MemoriesClientProps) {
  const [year, setYear] = useState("all");
  const [tag, setTag] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
  const hasActiveFilters = year !== "all" || tag !== "all" || search.trim() !== "";
  const memoriesCountLabel = hasActiveFilters
    ? `Showing ${filtered.length} of ${memories.length}`
    : `${memories.length} ${memories.length === 1 ? "memory" : "memories"}`;
  const visibleMemories = filtered.slice(0, visibleCount);
  const hasMoreMemories = visibleCount < filtered.length;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMoreMemories) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCount((count) => Math.min(count + 12, filtered.length));
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length, hasMoreMemories]);

  return (
    <div className="page-enter-stagger">
      <section className="surface-muted p-3.5 md:p-6">
        <div>
          {/* One count, not three: the kicker count and permanent subtitle
              duplicated the headline; a count only matters while filtering. */}
          <p className="section-kicker uppercase tracking-[0.18em]">Memories</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)] md:text-2xl">
            Revisit your highlights
          </h2>
          {hasActiveFilters ? (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {memoriesCountLabel}
            </p>
          ) : null}
        </div>
        <div className="mt-3">
          <div className="flex h-11 items-center rounded-2xl border border-[var(--panel-border)] bg-white/70 p-1 shadow-[var(--shadow-xs)] transition focus-within:border-rose-300 focus-within:bg-white/90">
            <div className="relative flex h-full min-w-0 flex-1 items-center">
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
                aria-label="Search memories"
                className="h-full min-w-0 w-full bg-transparent py-2 pl-9 pr-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                placeholder="Search memories"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(12);
                }}
              />
            </div>
            <div className="relative flex h-8 w-[106px] shrink-0 items-center border-l border-[var(--panel-border)]">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--accent-strong)]">
                <CalendarIcon />
              </span>
              <select
                aria-label="Filter memories by year"
                className="h-full w-full cursor-pointer appearance-none bg-transparent py-1 pl-8 pr-6 text-xs font-semibold leading-none text-[var(--text-secondary)] outline-none"
                onChange={(event) => {
                  setYear(event.target.value);
                  setVisibleCount(12);
                }}
                value={year}
              >
                <option value="all">All years</option>
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute right-2 h-3 w-3 text-[var(--text-tertiary)]"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="m3 4.5 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {/* The tag chips below are the single tag filter — the old "All
              tags" dropdown duplicated them on desktop. */}
          {tags.length > 0 ? (
            <div className="scrollbar-none -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 md:flex-wrap md:overflow-visible">
              <button
                className={`min-h-8 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  tag === "all"
                    ? "border-rose-300 bg-rose-100 text-rose-700"
                    : "border-[var(--panel-border)] bg-white/70 text-[var(--text-tertiary)] hover:border-rose-300 hover:text-rose-700"
                }`}
                onClick={() => {
                  setTag("all");
                  setVisibleCount(12);
                }}
                type="button"
              >
                All
              </button>
              {tags.map((value) => (
                <button
                  key={value}
                  className={`min-h-8 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    tag === value
                      ? "border-rose-300 bg-rose-100 text-rose-700"
                      : "border-[var(--panel-border)] bg-white/70 text-[var(--text-tertiary)] hover:border-rose-300 hover:text-rose-700"
                  }`}
                  onClick={() => {
                    setTag(value);
                    setVisibleCount(12);
                  }}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
      {/* Desktop uses the full container width as a grid — the old
          single-column max-w-4xl rows were ~1100px of mostly whitespace. */}
      <div className="stagger-children mt-4 flex flex-col gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
        {visibleMemories.map((event) => {
          const visibleTags = event.tags.slice(0, 2);
          const hiddenTagCount = Math.max(event.tags.length - visibleTags.length, 0);
          return (
            <div
              key={event.id}
              className="group/memory surface relative flex h-full flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Link
                href={`/events/${event.id}?from=memories&spaceId=${encodeURIComponent(spaceId)}`}
                aria-label={`Open ${event.title}`}
                className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-400"
              />
              <MemoryCover
                coverUrl={event.coverUrl}
                fallbackCoverUrl={event.fallbackCoverUrl}
                placeId={event.placeId}
                title={event.title}
                sizeClass="aspect-[4/3] w-full"
              >
                {visibleTags.length > 0 ? (
                  <div className="absolute right-3 top-3 flex max-w-[65%] items-center justify-end gap-1.5">
                    {visibleTags.map((value) => (
                      <span
                        key={value}
                        className="min-w-0 truncate rounded-full border border-white/40 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md"
                      >
                        {value}
                      </span>
                    ))}
                    {hiddenTagCount > 0 ? (
                      <span className="shrink-0 rounded-full border border-white/40 bg-black/30 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                        +{hiddenTagCount}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {/* Title and meta ride the scrim so the photo keeps the card. */}
                <div className="absolute inset-x-0 bottom-0 flex min-w-0 flex-col gap-1 p-4 text-white">
                  <h2 className="break-words text-lg font-semibold leading-snug tracking-[-0.015em] line-clamp-2 [overflow-wrap:anywhere] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] md:text-xl md:font-[var(--font-display)]">
                    {event.title}
                  </h2>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/85">
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <CalendarIcon />
                      <LocalTime
                        options={{ month: "short", day: "numeric", year: "numeric" }}
                        value={event.dateTimeStart}
                      />
                    </span>
                    {event.placeName ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <span aria-hidden="true">·</span>
                        <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{event.placeName}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </MemoryCover>
            </div>
          );
        })}
      </div>
      {hasMoreMemories ? (
        <div ref={loadMoreRef} className="py-6 text-center text-xs font-medium text-[var(--text-tertiary)]">
          Loading more memories...
        </div>
      ) : filtered.length > 0 ? (
        <div className="py-6 text-center text-xs font-medium text-[var(--text-tertiary)]">
          You&apos;re caught up.
        </div>
      ) : null}
    </div>
  );
}
