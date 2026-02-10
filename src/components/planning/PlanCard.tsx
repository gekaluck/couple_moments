"use client";

import Link from "next/link";
import { CalendarClock, MapPin, MessageSquare } from "lucide-react";
import Card, { CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatEventDateTime } from "@/lib/formatters";

type PlanCardProps = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: Date;
  timeIsSet?: boolean;
  commentCount?: number;
  createdBy?: { name: string | null; email: string };
  placeName?: string | null;
};

function getDayDiff(date: Date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfDate.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

export default function PlanCard({
  id,
  title,
  description,
  dateTimeStart,
  timeIsSet = true,
  commentCount = 0,
  createdBy,
  placeName,
}: PlanCardProps) {
  const dayDiff = getDayDiff(dateTimeStart);
  const proximityLabel =
    dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : null;

  return (
    <Link href={`/events/${id}`} className="block">
      <Card
        variant="rose"
        hover
        padding="sm"
        className="group/plan card-hover animate-fade-in-up border-rose-200/70 bg-[linear-gradient(150deg,rgba(255,255,255,0.95),rgba(255,238,244,0.74))]"
      >
        <CardHeader>
          <div className="min-w-0 flex-1 space-y-1">
            {proximityLabel ? (
              <span className="inline-flex rounded-full border border-rose-200/70 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-700">
                {proximityLabel}
              </span>
            ) : null}
            <CardTitle className="text-lg text-[var(--text-primary)]">{title}</CardTitle>
          </div>
          {commentCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/70 bg-white/85 px-2 py-1 text-xs text-rose-700 shadow-sm">
              <MessageSquare className="h-3.5 w-3.5" />
              {commentCount}
            </span>
          ) : null}
        </CardHeader>
        {description ? (
          <CardDescription className="text-[var(--text-muted)]">
            {description}
          </CardDescription>
        ) : null}
        <CardFooter className="flex-col items-start gap-2 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <CalendarClock className="h-4 w-4 text-rose-500" />
              {formatEventDateTime(dateTimeStart, timeIsSet)}
              {!timeIsSet ? (
                <span className="rounded-full border border-rose-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                  Anytime
                </span>
              ) : null}
            </div>
            {createdBy ? (
              <span className="text-xs text-[var(--text-tertiary)]">
                by{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {createdBy.name || createdBy.email}
                </span>
              </span>
            ) : null}
          </div>
          {placeName ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/75 px-3 py-1 text-xs text-[var(--text-tertiary)]">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-[var(--text-muted)]">
                {placeName}
              </span>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </Link>
  );
}
