"use client";

import { useRef, useState, type ReactNode } from "react";

type HorizontalRailProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  accent?: "rose" | "amber";
};

const ACCENT_DOTS = {
  rose: { active: "bg-rose-400", inactive: "bg-rose-200" },
  amber: { active: "bg-amber-400", inactive: "bg-amber-200" },
};

export default function HorizontalRail<T>({
  items,
  getKey,
  renderItem,
  accent = "rose",
}: HorizontalRailProps<T>) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dotColors = ACCENT_DOTS[accent];

  function handleScroll() {
    const rail = railRef.current;
    if (!rail || items.length < 2) {
      return;
    }
    const slide = rail.firstElementChild as HTMLElement | null;
    const step = slide ? slide.offsetWidth + 12 : rail.clientWidth;
    const index = Math.round(rail.scrollLeft / step);
    setActiveIndex(Math.max(0, Math.min(items.length - 1, index)));
  }

  return (
    <div className="flex flex-col gap-2.5 md:block">
      <div
        ref={railRef}
        onScroll={handleScroll}
        className="scrollbar-none stagger-children -mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-1 md:m-0 md:snap-none md:flex-col md:gap-4 md:overflow-visible md:p-0"
      >
        {items.map((item) => (
          <div
            key={getKey(item)}
            className="flex w-full min-w-full snap-start md:min-w-0"
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div
          aria-hidden="true"
          className="flex items-center justify-center gap-1.5 md:hidden"
        >
          {items.map((item, index) => (
            <span
              key={getKey(item)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === activeIndex
                  ? `w-4 ${dotColors.active}`
                  : `w-1.5 ${dotColors.inactive}`
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
