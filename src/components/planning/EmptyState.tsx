"use client";

import { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-[var(--panel-border)] bg-[rgba(255,255,255,0.72)] p-7 text-center shadow-[var(--shadow-soft)] backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-[var(--shadow-sm)]">
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          className="button-hover rounded-full bg-[var(--action-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition hover:bg-[var(--action-primary-strong)]"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
