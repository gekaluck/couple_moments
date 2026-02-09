import { ReactNode } from "react";

type PlanningSectionProps = {
  children: ReactNode;
  actions?: ReactNode;
};

export default function PlanningSection({ children, actions }: PlanningSectionProps) {
  return (
    <section className="surface p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)] md:text-3xl">
          What&apos;s ahead
        </h2>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
