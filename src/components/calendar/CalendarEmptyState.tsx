import Link from 'next/link';
import { Calendar as CalendarIcon } from 'lucide-react';
import React from 'react';

interface CalendarEmptyStateProps {
    actionHref?: string;
}

export function CalendarEmptyState({ actionHref }: CalendarEmptyStateProps) {
    return (
        <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[var(--panel-border)] bg-white/40 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <CalendarIcon className="h-8 w-8" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">No events this month</h3>
                <p className="max-w-xs text-sm text-[var(--text-muted)]">
                    It looks a bit quiet here. Start planning your next adventure!
                </p>
            </div>
            {actionHref && (
                <Link
                    href={actionHref}
                    className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-sm ring-1 ring-inset ring-[var(--panel-border)] transition hover:bg-[var(--surface-hover)]"
                >
                    Add Event
                </Link>
            )}
        </div>
    );
}
