"use client";

import { useState } from "react";
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
};

export default function UpcomingPlansColumn({
  plans,
  commentCounts,
  mapsApiKey,
  onCreatePlan,
}: UpcomingPlansColumnProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        <button
          className="button-hover rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:bg-rose-600 hover:shadow-[var(--shadow-lg)]"
          onClick={() => setIsCreateOpen(true)}
          type="button"
        >
          Create plan
        </button>
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
        <div className="flex flex-col gap-4">
          {plans.map((plan) => (
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
