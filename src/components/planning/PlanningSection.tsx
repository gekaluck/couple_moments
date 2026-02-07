import { ReactNode } from "react";

type PlanningSectionProps = {
  children: ReactNode;
  actions?: ReactNode;
};

export default function PlanningSection({ children, actions }: PlanningSectionProps) {
  return (
    <section className="surface p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Planning</p>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)] md:text-3xl">
            Upcoming momentum
          </h2>
          <p className="section-subtitle mt-2">
            Keep ideas alive and turn them into plans you will actually do.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/80 px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]">
            <span className="relative h-4 w-6">
              <span className="absolute left-0 top-0 h-4 w-4 rounded-full bg-rose-400/85" />
              <span className="absolute left-2 top-0 h-4 w-4 rounded-full bg-amber-400/85" />
            </span>
            Cozy planning for two
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
