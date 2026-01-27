"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type EventBubbleProps = {
  href: string;
  title: string;
  timeLabel?: string | null;
  isPast: boolean;
};

export default function EventBubble({
  href,
  title,
  timeLabel,
  isPast,
}: EventBubbleProps) {
  const textRef = useRef<HTMLDivElement | null>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const node = textRef.current;
    if (!node) {
      return;
    }

    const updateOverflow = () => {
      setIsOverflow(node.scrollWidth > node.clientWidth);
    };

    updateOverflow();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateOverflow);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateOverflow);
    return () => window.removeEventListener("resize", updateOverflow);
  }, [title]);

  return (
    <Link
      className={`group relative rounded-lg border px-2 py-1 text-xs transition hover:scale-[1.01] hover:shadow-md ${
        isPast
          ? "border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400"
          : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
      }`}
      href={href}
    >
      <div className="flex items-center justify-between gap-2">
        <div ref={textRef} className="truncate text-[13px] font-semibold">
          {title}
        </div>
        {timeLabel ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {timeLabel}
          </span>
        ) : null}
      </div>
      {isOverflow ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-max max-w-[220px] -translate-x-1/2 -translate-y-full whitespace-normal rounded-lg border border-[var(--panel-border)] bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] shadow-md opacity-0 transition group-hover:block group-hover:opacity-100"
        >
          {title}
        </span>
      ) : null}
    </Link>
  );
}
