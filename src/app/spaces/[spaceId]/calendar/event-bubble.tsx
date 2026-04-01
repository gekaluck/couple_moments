"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type EventBubbleProps = {
  href: string;
  title: string;
  isPast: boolean;
  spanPosition?: "single" | "start" | "middle" | "end";
  timeLabel?: string;
  tooltipLabel?: string;
};

export default function EventBubble({
  href,
  title,
  isPast,
  spanPosition = "single",
  timeLabel,
  tooltipLabel,
}: EventBubbleProps) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const shapeClass =
    spanPosition === "single"
      ? "rounded-xl"
      : spanPosition === "start"
        ? "rounded-l-xl rounded-r-md"
        : spanPosition === "end"
          ? "rounded-l-md rounded-r-xl"
          : "rounded-md";

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
      aria-label={title}
      className={`group/event relative flex items-center gap-2 border px-2.5 py-1.5 text-xs transition hover:shadow-[var(--shadow-sm)] ${shapeClass} ${
        isPast
          ? "border-[#d7e0e8] bg-white/82 text-[#627487]"
          : "border-rose-200/75 bg-[linear-gradient(160deg,rgba(255,250,252,0.95),rgba(255,240,246,0.9))] text-rose-700"
      }`}
      href={href}
      title={tooltipLabel ?? title}
    >
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
          isPast ? "bg-[var(--calendar-memory-dot)]" : "bg-rose-500"
        }`}
      />
      <div className="min-w-0">
        {timeLabel ? (
          <div className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-current/75">
            {timeLabel}
          </div>
        ) : null}
        <span ref={textRef} className="block truncate text-[11px] font-medium leading-tight">
          {title}
        </span>
      </div>
      {isOverflow ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-max max-w-[220px] -translate-x-1/2 -translate-y-full whitespace-normal rounded-lg border border-[var(--panel-border)] bg-white px-2.5 py-1 text-[10px] font-medium text-[var(--text-primary)] shadow-md opacity-0 transition group-hover/event:block group-hover/event:opacity-100"
        >
          {tooltipLabel ?? title}
        </span>
      ) : null}
    </Link>
  );
}
