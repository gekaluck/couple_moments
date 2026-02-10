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
  return (
    <Link href={`/events/${id}`} className="block">
      <Card variant="rose" hover padding="md" className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-base text-rose-900">{title}</CardTitle>
          {commentCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white/80 px-2 py-1 text-xs text-rose-600 shadow-sm">
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
        <CardFooter className="flex-col items-start gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <CalendarClock className="h-4 w-4 text-rose-500" />
              {formatEventDateTime(dateTimeStart, timeIsSet)}
              {!timeIsSet ? (
                <span className="rounded-full border border-rose-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
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
            <div className="inline-flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <MapPin className="h-4 w-4 text-rose-500" />
              <span className="text-[var(--text-muted)]">{placeName}</span>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </Link>
  );
}
