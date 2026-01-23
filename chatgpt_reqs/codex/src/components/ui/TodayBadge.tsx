"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";

type TodayBadgeProps = {
  href: string;
  compact?: boolean;
};

export default function TodayBadge({ href, compact = false }: TodayBadgeProps) {
  const today = new Date();
  const dayOfMonth = today.getDate();

  return (
    <Link href={href} className="today-badge group">
      <Calendar className="h-3.5 w-3.5" />
      {!compact && (
        <>
          <span>Today</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
            {dayOfMonth}
          </span>
        </>
      )}
    </Link>
  );
}
