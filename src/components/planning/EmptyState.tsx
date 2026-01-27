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
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[var(--shadow-sm)]">
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
          className="button-hover rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
