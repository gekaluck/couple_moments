import { ReactNode } from "react";

type PlanningSectionProps = {
  children: ReactNode;
};

export default function PlanningSection({ children }: PlanningSectionProps) {
  return (
    <section className="rounded-2xl border border-[var(--panel-border)] bg-white/80 p-6 shadow-[var(--shadow-lg)]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[var(--font-display)]">
          Planning
        </h2>
      </div>
      {children}
    </section>
  );
}
