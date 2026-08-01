import { Lock } from "lucide-react";

type DemoDisabledNoteProps = {
  children: React.ReactNode;
};

/**
 * Stands in for a control that is switched off in the demo, so the surface still
 * reads as complete rather than looking half-built.
 */
export default function DemoDisabledNote({ children }: DemoDisabledNoteProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-[var(--text-muted)]">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-slate-600">
        <Lock className="h-3 w-3" />
      </span>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
