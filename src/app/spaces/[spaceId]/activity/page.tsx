import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getCoupleSpaceForUser, listSpaceMembers } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { countActivityForSpace, listActivityForSpace } from "@/lib/activity";
import { resolveCalendarTimeFormat } from "@/lib/calendar";
import { buildCreatorVisuals } from "@/lib/creator-colors";
import ActivityFeed from "./activity-feed";

type PageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams?: Promise<{ page?: string; q?: string }>;
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
  const query = search.q?.trim() ?? "";
  const pageSize = 30;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    redirect("/spaces/onboarding");
  }

  const [totalCount, members] = await Promise.all([
    countActivityForSpace(space.id, query),
    listSpaceMembers(space.id),
  ]);
  const memberVisuals = buildCreatorVisuals(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      alias: member.alias,
      initials: member.initials,
      color: member.color,
    })),
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleCount = currentPage * pageSize;
  const pageActivity = await listActivityForSpace(space.id, {
    skip: 0,
    take: visibleCount,
    query,
  });
  const hasNextPage = currentPage < totalPages;
  const buildActivityHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("page", targetPage.toString());
    if (query) {
      params.set("q", query);
    }
    return `/spaces/${space.id}/activity?${params.toString()}`;
  };

  return (
    <>
      <ActivityFeed
        spaceId={space.id}
        currentUserId={userId}
        memberVisuals={memberVisuals}
        totalCount={totalCount}
        initialQuery={query}
        entries={pageActivity.map((entry) => ({
          id: entry.id,
          type: entry.type,
          createdAt: entry.createdAt.toISOString(),
          actorId: entry.actorId,
          actor: {
            id: entry.actor.id,
            name: entry.actor.name,
            email: entry.actor.email,
          },
          target: entry.target,
          body: entry.body,
          memory: entry.memory,
          photos: entry.photos,
          relatedIdea: entry.relatedIdea,
        }))}
        timeFormat={calendarTimeFormat}
      />
      {totalCount > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 px-1">
          <div className="text-xs text-[var(--text-tertiary)]">
            Showing {pageActivity.length} of {totalCount}
          </div>
            {hasNextPage ? (
              <Link
                className="rounded-full border border-transparent bg-cta px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                href={buildActivityHref(currentPage + 1)}
              >
                Load more
              </Link>
            ) : (
              <span className="text-xs font-medium text-[var(--text-tertiary)]">
                You&apos;re caught up.
              </span>
            )}
        </div>
      ) : null}
    </>
  );
}
