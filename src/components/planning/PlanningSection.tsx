import { ReactNode } from "react";

type PlanningSectionProps = {
  children: ReactNode;
  actions?: ReactNode;
};

export default function PlanningSection({ children, actions }: PlanningSectionProps) {
  return (
    <section className="rounded-2xl border border-[var(--panel-border)] bg-white/80 p-6 shadow-[var(--shadow-lg)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Planning</p>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[var(--font-display)]">
            Upcoming momentum
          </h2>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
