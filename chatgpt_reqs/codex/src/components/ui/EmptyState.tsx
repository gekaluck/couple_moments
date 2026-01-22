"use client";

import React, { ReactNode } from "react";

type EmptyStateVariant = "calendar" | "memories" | "ideas" | "notes" | "activity" | "generic";

type EmptyStateProps = {
  variant?: EmptyStateVariant;
  title: string;
  description: string;
  action?: ReactNode;
};

function CalendarIllustration() {
  return (
    <svg className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <rect x="12" y="20" width="72" height="60" rx="8" className="fill-rose-100 stroke-rose-300" strokeWidth="2" />
      <rect x="12" y="20" width="72" height="16" rx="8" className="fill-rose-200" />
      <rect x="24" y="12" width="4" height="16" rx="2" className="fill-rose-400" />
      <rect x="68" y="12" width="4" height="16" rx="2" className="fill-rose-400" />
      <circle cx="36" cy="52" r="6" className="fill-rose-300" />
      <circle cx="60" cy="52" r="6" className="fill-pink-300" />
      <path d="M42 52 C 48 62, 54 62, 60 52" className="stroke-rose-400" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function MemoriesIllustration() {
  return (
    <svg className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <rect x="16" y="24" width="48" height="48" rx="6" className="fill-slate-100 stroke-slate-300" strokeWidth="2" />
      <rect x="32" y="16" width="48" height="48" rx="6" className="fill-white stroke-slate-300" strokeWidth="2" />
      <circle cx="56" cy="36" r="8" className="fill-rose-200" />
      <path d="M40 56 L48 48 L56 54 L68 42" className="stroke-rose-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M74 56 L74 56" className="stroke-rose-400" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function IdeasIllustration() {
  return (
    <svg className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <ellipse cx="48" cy="80" rx="16" ry="4" className="fill-amber-100" />
      <path d="M36 52 C36 36, 60 36, 60 52 C60 60, 56 64, 56 72 L40 72 C40 64, 36 60, 36 52Z" className="fill-amber-200 stroke-amber-400" strokeWidth="2" />
      <path d="M40 72 L40 80 C40 82 56 82 56 80 L56 72" className="fill-amber-300 stroke-amber-400" strokeWidth="2" />
      <circle cx="48" cy="20" r="4" className="fill-amber-400" />
      <path d="M48 24 L48 32" className="stroke-amber-400" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 32 L38 38" className="stroke-amber-300" strokeWidth="2" strokeLinecap="round" />
      <path d="M64 32 L58 38" className="stroke-amber-300" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NotesIllustration() {
  return (
    <svg className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <rect x="20" y="16" width="56" height="68" rx="6" className="fill-violet-100 stroke-violet-300" strokeWidth="2" />
      <path d="M32 32 L64 32" className="stroke-violet-300" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 44 L58 44" className="stroke-violet-300" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 56 L52 56" className="stroke-violet-300" strokeWidth="2" strokeLinecap="round" />
      <circle cx="72" cy="68" r="14" className="fill-violet-400" />
      <path d="M68 68 L72 72 L80 64" className="stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityIllustration() {
  return (
    <svg className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="32" className="fill-sky-100 stroke-sky-300" strokeWidth="2" />
      <circle cx="48" cy="48" r="4" className="fill-sky-400" />
      <path d="M48 28 L48 48" className="stroke-sky-400" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 48 L62 56" className="stroke-sky-300" strokeWidth="2" strokeLinecap="round" />
      <circle cx="48" cy="20" r="2" className="fill-sky-400" />
      <circle cx="76" cy="48" r="2" className="fill-sky-400" />
      <circle cx="48" cy="76" r="2" className="fill-sky-400" />
      <circle cx="20" cy="48" r="2" className="fill-sky-400" />
    </svg>
  );
}

function GenericIllustration() {
  return (
    <svg className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="28" className="fill-slate-100 stroke-slate-300" strokeWidth="2" />
      <circle cx="40" cy="44" r="4" className="fill-slate-400" />
      <circle cx="56" cy="44" r="4" className="fill-slate-400" />
      <path d="M38 58 C42 64, 54 64, 58 58" className="stroke-slate-400" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const illustrations: Record<EmptyStateVariant, () => React.ReactElement> = {
  calendar: CalendarIllustration,
  memories: MemoriesIllustration,
  ideas: IdeasIllustration,
  notes: NotesIllustration,
  activity: ActivityIllustration,
  generic: GenericIllustration,
};

export default function EmptyState({
  variant = "generic",
  title,
  description,
  action,
}: EmptyStateProps) {
  const Illustration = illustrations[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
      <div className="mb-6 opacity-80">
        <Illustration />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-[var(--text-muted)]">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
