"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

import EmptyState from "./EmptyState";
import PlanCard from "./PlanCard";
import CreatePlanModal from "./CreatePlanModal";

type Plan = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: Date;
  timeIsSet?: boolean;
  createdBy?: { name: string | null; email: string };
};

type UpcomingPlansColumnProps = {
  plans: Plan[];
  commentCounts: Record<string, number>;
  mapsApiKey?: string;
  onCreatePlan: (formData: FormData) => Promise<void>;
  autoOpen?: boolean;
  todayHref?: string;
};

export default function UpcomingPlansColumn({
  plans,
  commentCounts,
  mapsApiKey,
  onCreatePlan,
  autoOpen = false,
  todayHref,
}: UpcomingPlansColumnProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const visiblePlans = plans.slice(0, visibleCount);
  const hasMore = plans.length > visibleCount;

  useEffect(() => {
    if (autoOpen) {
      setIsCreateOpen(true);
    }
  }, [autoOpen]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Upcoming plans
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              {plans.length} plans
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {todayHref ? (
            <a
              className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 transition hover:bg-rose-50"
              href={todayHref}
            >
              Today
            </a>
          ) : null}
          <button
            className="button-hover rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:bg-rose-600 hover:shadow-[var(--shadow-lg)]"
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            Create plan
          </button>
        </div>
      </div>
      {plans.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8 text-rose-500" />}
          title="No plans yet"
          description="Start planning your next adventure!"
          actionLabel="Create plan"
          onAction={() => setIsCreateOpen(true)}
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
            />
          ))}
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 transition hover:bg-rose-100 hover:shadow-sm"
            >
              Show more ({plans.length - visibleCount} remaining)
            </button>
          ) : null}
        </div>
      )}
      <CreatePlanModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={onCreatePlan}
        mapsApiKey={mapsApiKey}
      />
    </div>
  );
}
