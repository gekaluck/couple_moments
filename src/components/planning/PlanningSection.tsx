"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useId, useState } from "react";

type PlanningSectionProps = {
  children: ReactNode;
  actions?: ReactNode;
  ideaCount: number;
  planCount: number;
};

function countLabel(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export default function PlanningSection({
  children,
  actions,
  ideaCount,
  planCount,
}: PlanningSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();
  const summary = `${countLabel(planCount, "plan")} · ${countLabel(ideaCount, "idea")}`;

  return (
    <section className="surface mt-4 p-4 md:mt-6 md:p-6 xl:p-8">
      <button
        type="button"
        aria-controls={contentId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 text-left md:hidden"
      >
        <span className="min-w-0">
          <span className="block text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)]">
            What&apos;s ahead
          </span>
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
            {summary}
          </span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white/80 text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div className="mb-6 hidden flex-wrap items-center justify-between gap-3 md:flex">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)] md:text-3xl">
          What&apos;s ahead
        </h2>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      <div
        id={contentId}
        className={`${isOpen ? "mt-5 block" : "hidden"} md:mt-0 md:block`}
      >
        {children}
      </div>
    </section>
  );
}
