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
      className={`group relative flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition hover:shadow-[var(--shadow-sm)] ${
        isPast
          ? "bg-slate-100/85 text-slate-500"
          : "bg-rose-100/80 text-rose-700"
      }`}
      href={href}
    >
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
          isPast ? "bg-slate-400" : "bg-rose-400"
        }`}
      />
      <span ref={textRef} className="truncate text-[11px] font-medium">
        {title}
      </span>
      {isOverflow ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-max max-w-[200px] -translate-x-1/2 -translate-y-full whitespace-normal rounded-lg border border-[var(--panel-border)] bg-white px-2.5 py-1 text-[10px] font-medium text-[var(--text-primary)] shadow-md opacity-0 transition group-hover:block group-hover:opacity-100"
        >
          {title}
        </span>
      ) : null}
    </Link>
  );
}
