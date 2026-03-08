"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type NotesFilterValue = "all" | "free" | "event";

type NotesFiltersProps = {
  initialQuery: string;
  initialFilter: NotesFilterValue;
};

const FILTER_OPTIONS: Array<{ value: NotesFilterValue; label: string }> = [
  { value: "all", label: "All notes" },
  { value: "free", label: "Free notes" },
  { value: "event", label: "Linked to events" },
];

const SearchIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
    <path d="m20 20-3.5-3.5" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function NotesFilters({ initialQuery, initialFilter }: NotesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const currentFilter = (searchParams.get("type") as NotesFilterValue | null) ?? initialFilter;

  const buildUrl = useMemo(
    () =>
      (nextQuery: string, nextFilter: NotesFilterValue) => {
        const params = new URLSearchParams(searchParams.toString());
        const trimmedQuery = nextQuery.trim();

        if (trimmedQuery) {
          params.set("q", trimmedQuery);
        } else {
          params.delete("q");
        }

        if (nextFilter === "all") {
          params.delete("type");
        } else {
          params.set("type", nextFilter);
        }

        params.delete("page");
        const nextQueryString = params.toString();
        return nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
      },
    [pathname, searchParams],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextUrl = buildUrl(query, currentFilter);
      const currentUrl = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [buildUrl, currentFilter, pathname, query, router, searchParams]);

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-[var(--panel-border)] bg-white/70 p-3">
      <label className="block">
        <span className="sr-only">Search notes</span>
        <div className="relative flex h-11 items-center">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            <SearchIcon />
          </span>
          <input
            className="h-11 w-full rounded-full border border-[var(--panel-border)] bg-white pl-9 pr-4 text-sm leading-none text-[var(--text-primary)] shadow-sm outline-none transition focus:border-[var(--accent)]"
            placeholder="Search notes..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isActive = currentFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "border-rose-300 bg-rose-100 text-rose-700"
                  : "border-[var(--panel-border)] bg-white/80 text-[var(--text-tertiary)] hover:border-rose-300 hover:text-rose-700"
              }`}
              onClick={() => {
                const nextUrl = buildUrl(query, option.value);
                router.replace(nextUrl, { scroll: false });
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
