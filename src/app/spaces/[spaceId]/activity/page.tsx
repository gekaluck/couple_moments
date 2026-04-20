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

  const [totalCount, members] = await Promise.all([
    countActivityForSpace(space.id),
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
  const startIndex = (currentPage - 1) * pageSize;
  const pageActivity = await listActivityForSpace(space.id, {
    skip: startIndex,
    take: pageSize,
  });
  const hasNextPage = currentPage < totalPages;

  return (
    <>
      <ActivityFeed
        spaceId={space.id}
        currentUserId={userId}
        memberVisuals={memberVisuals}
        totalCount={totalCount}
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-1">
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
    </>
  );
}
