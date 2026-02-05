import Link from "next/link";
import { redirect } from "next/navigation";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { listActivityForSpace } from "@/lib/activity";
import { formatTimestamp } from "@/lib/formatters";
import EmptyState from "@/components/ui/EmptyState";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 text-[var(--text-tertiary)]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="1.5" />
    <path d="M8 3v4M16 3v4M3 10h18" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IdeaIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 text-[var(--text-tertiary)]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M9 18h6M10 21h4M8 14a6 6 0 1 1 8 0c-1 1-2 2-2 4h-4c0-2-1-3-2-4Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CommentIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 text-[var(--text-tertiary)]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NoteIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 text-[var(--text-tertiary)]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M7 4h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 4v4h4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function formatDayHeading(date: Date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ActivityPage({ params }: PageProps) {
  const userId = await requireUserId();
  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    redirect("/spaces/onboarding");
  }

  const activity = await listActivityForSpace(space.id);

  const grouped = activity.reduce<Map<string, typeof activity>>((acc, entry) => {
    // Use local date for grouping to avoid timezone issues
    const d = entry.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const list = acc.get(key) ?? [];
    list.push(entry);
    acc.set(key, list);
    return acc;
  }, new Map());

  const groupedEntries = Array.from(grouped.entries()).sort((a, b) =>
    a[0] < b[0] ? 1 : -1,
  );

  return (
    <>
      <section className="surface-muted p-6">
        <p className="section-kicker">Activity</p>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
          Activity feed
        </h2>
        <p className="section-subtitle">
          Every meaningful action across your space.
        </p>
      </section>
      <section className="flex flex-col gap-6">
        {activity.length === 0 ? (
          <div className="surface p-6">
            <EmptyState
              variant="activity"
              title="No activity yet"
              description="Actions like creating events, adding ideas, and posting comments will show up here."
            />
          </div>
        ) : null}
        {groupedEntries.map(([key, entries]) => (
          <div key={key} className="stagger-children flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
              {formatDayHeading(entries[0].createdAt)}
            </div>
            {entries
              .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
              .map((entry) => (
                <div key={entry.id} className="surface p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-sm text-gray-700">
                        {entry.entityType === "EVENT" ? (
                          <CalendarIcon />
                        ) : entry.entityType === "IDEA" ? (
                          <IdeaIcon />
                        ) : entry.entityType === "COMMENT" ? (
                          <CommentIcon />
                        ) : (
                          <NoteIcon />
                        )}
                        <span>{entry.action}</span>
                        {entry.entityTitle && entry.entityHref ? (
                          <>
                            <span>:</span>
                            <Link
                              className="font-medium text-rose-600 transition hover:text-rose-700 hover:underline"
                              href={entry.entityHref}
                            >
                              {entry.entityTitle}
                            </Link>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {entry.user.name || entry.user.email}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {formatTimestamp(entry.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </section>
    </>
  );
}
