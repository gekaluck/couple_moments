"use client";

import Link from "next/link";
import { CalendarClock, MessageSquare } from "lucide-react";

type PlanCardProps = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: Date;
  timeIsSet?: boolean;
  commentCount?: number;
};

function formatDateTime(date: Date, timeIsSet?: boolean) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(timeIsSet ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export default function PlanCard({
  id,
  title,
  description,
  dateTimeStart,
  timeIsSet = true,
  commentCount = 0,
}: PlanCardProps) {
  return (
    <Link
      href={`/events/${id}`}
      className="animate-fade-in-up group rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-5 transition-all duration-200 hover:scale-[1.02] hover:border-rose-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        {commentCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white/80 px-2 py-1 text-xs text-rose-600 shadow-sm">
            <MessageSquare className="h-3.5 w-3.5" />
            {commentCount}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2">
          {description}
        </p>
      ) : null}
      <div className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <CalendarClock className="h-4 w-4 text-rose-500" />
        {formatDateTime(dateTimeStart, timeIsSet)}
        {!timeIsSet ? (
          <span className="rounded-full border border-rose-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
            Anytime
          </span>
        ) : null}
      </div>
    </Link>
  );
}
