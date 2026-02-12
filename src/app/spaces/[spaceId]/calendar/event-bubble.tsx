"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type EventBubbleProps = {
  href: string;
  title: string;
  isPast: boolean;
};

export default function EventBubble({
  href,
  title,
  isPast,
}: EventBubbleProps) {
  const textRef = useRef<HTMLSpanElement | null>(null);
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
      className={`group/event relative flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs transition hover:translate-x-0.5 hover:shadow-[var(--shadow-sm)] ${
        isPast
          ? "border-[#d7e0e8] bg-white/85 text-[#627487]"
          : "border-rose-200/80 bg-[linear-gradient(160deg,rgba(255,250,252,0.96),rgba(255,236,245,0.92))] text-rose-700"
      }`}
      href={href}
    >
      <span
        className={`h-2 w-2 flex-shrink-0 rounded-full ${
          isPast ? "bg-[#8b9daf]" : "bg-rose-500"
        }`}
      />
      <span ref={textRef} className="truncate text-[11px] font-medium leading-tight">
        {title}
      </span>
      {isOverflow ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-max max-w-[220px] -translate-x-1/2 -translate-y-full whitespace-normal rounded-lg border border-[var(--panel-border)] bg-white px-2.5 py-1 text-[10px] font-medium text-[var(--text-primary)] shadow-md opacity-0 transition group-hover/event:block group-hover/event:opacity-100"
        >
          {title}
        </span>
      ) : null}
    </Link>
  );
}
