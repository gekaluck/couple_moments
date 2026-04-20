"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import Link from "next/link";

import EmptyState from "./EmptyState";
import PlanCard from "./PlanCard";
import { CalendarTimeFormat } from "@/lib/calendar";

type Plan = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: Date;
  timeIsSet?: boolean;
  createdBy?: { name: string | null; email: string };
  placeName?: string | null;
};

type UpcomingPlansColumnProps = {
  plans: Plan[];
  commentCounts: Record<string, number>;
  newEventHref?: string;
  timeFormat?: CalendarTimeFormat;
  onDeleteEvent?: (formData: FormData) => Promise<
    | void
    | {
        googleSync?: {
          attempted: boolean;
          success: boolean;
          message?: string;
          info?: string;
        };
      }
  >;
};

export default function UpcomingPlansColumn({
  plans,
  commentCounts,
  newEventHref,
  timeFormat = "24h",
  onDeleteEvent,
}: UpcomingPlansColumnProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const visiblePlans = plans.slice(0, visibleCount);
  const hasMore = plans.length > visibleCount;

  const nextInDays = (() => {
    const next = plans[0]?.dateTimeStart;
    if (!next) return null;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const target = new Date(next.getFullYear(), next.getMonth(), next.getDate());
    const diff = Math.round((target.getTime() - start.getTime()) / 86_400_000);
    if (diff < 0) return null;
    return diff;
  })();
  const subLabel =
    plans.length === 0
      ? "Nothing on the books"
      : nextInDays === 0
        ? `${plans.length} planned · next today`
        : nextInDays === 1
          ? `${plans.length} planned · next tomorrow`
          : nextInDays != null
            ? `${plans.length} planned · next in ${nextInDays} days`
            : `${plans.length} planned`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-50/90 text-rose-600 shadow-[var(--shadow-sm)]">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
              Upcoming plans
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">{subLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newEventHref ? (
            <Link
              className="button-hover rounded-full bg-[var(--action-primary)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:bg-[var(--action-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/40"
              href={newEventHref}
            >
              New event
            </Link>
          ) : null}
        </div>
      </div>
      {plans.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8 text-rose-500" />}
          title="No upcoming plans"
          description="Create an event from the calendar to start planning!"
        />
      ) : (
        <div className="stagger-children flex flex-col gap-4">
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              id={plan.id}
              title={plan.title}
              description={plan.description}
              dateTimeStart={plan.dateTimeStart}
              timeIsSet={plan.timeIsSet}
              commentCount={commentCounts[plan.id] ?? 0}
              createdBy={plan.createdBy}
              placeName={plan.placeName}
              timeFormat={timeFormat}
              onDelete={onDeleteEvent}
            />
          ))}
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className="rounded-2xl border border-rose-200/80 bg-rose-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-100/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              Show more ({plans.length - visibleCount} remaining)
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
