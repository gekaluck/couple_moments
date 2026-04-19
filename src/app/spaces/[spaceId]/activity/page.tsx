import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { countActivityForSpace, listActivityForSpace } from "@/lib/activity";
import { resolveCalendarTimeFormat } from "@/lib/calendar";
import EmptyState from "@/components/ui/EmptyState";
import ActivityFeed from "./activity-feed";

type PageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export default async function ActivityPage({ params, searchParams }: PageProps) {
  const cookieStore = await cookies();
  const calendarTimeFormat = resolveCalendarTimeFormat(
    cookieStore.get("cm_calendar_time_format")?.value,
  );
  const userId = await requireUserId();
  const { spaceId } = await params;
  const search = (await searchParams) ?? {};
  const page = Math.max(Number(search.page ?? "1") || 1, 1);
  const pageSize = 30;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    redirect("/spaces/onboarding");
  }

  const totalCount = await countActivityForSpace(space.id);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageActivity = await listActivityForSpace(space.id, {
    skip: startIndex,
    take: pageSize,
  });
  const hasNextPage = currentPage < totalPages;
  const pageStartLabel = totalCount === 0 ? 0 : startIndex + 1;
  const pageEndLabel = Math.min(startIndex + pageSize, totalCount);

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
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1">
            {totalCount} actions
          </span>
          <span className="rounded-full border border-[var(--panel-border)] bg-white/90 px-2.5 py-1">
            Page {currentPage} / {totalPages}
          </span>
          <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-rose-700">
            Shared timeline
          </span>
          {totalCount > 0 ? (
            <span className="rounded-full border border-[var(--panel-border)] bg-white/90 px-2.5 py-1 normal-case tracking-normal">
              Showing {pageStartLabel}-{pageEndLabel}
            </span>
          ) : null}
        </div>
      </section>
      <section className="flex flex-col gap-6">
        {totalCount === 0 ? (
          <div className="surface p-6">
            <EmptyState
              variant="activity"
              title="No activity yet"
              description="Actions like creating events, adding ideas, and posting comments will show up here."
            />
          </div>
        ) : null}
        <ActivityFeed
          entries={pageActivity.map((entry) => ({
            id: entry.id,
            action: entry.action,
            details: entry.details ?? null,
            entityType: entry.entityType,
            entityTitle: entry.entityTitle ?? null,
            entityHref: entry.entityHref ?? null,
            createdAt: entry.createdAt.toISOString(),
            user: {
              name: entry.user.name,
              email: entry.user.email,
            },
          }))}
          timeFormat={calendarTimeFormat}
        />
        {totalCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[var(--text-tertiary)]">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  className="rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-primary)] shadow-sm transition hover:shadow-md"
                  href={`/spaces/${space.id}/activity?page=${currentPage - 1}`}
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-full border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] opacity-60">
                  Previous
                </span>
              )}
              {hasNextPage ? (
                <Link
                  className="rounded-full border border-transparent bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                  href={`/spaces/${space.id}/activity?page=${currentPage + 1}`}
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-full border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] opacity-60">
                  Next
                </span>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
