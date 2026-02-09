import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { listEventsForSpace } from "@/lib/events";
import SpaceNav from "./space-nav";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ spaceId: string }>;
};

export default async function SpaceLayout({ children, params }: LayoutProps) {
  const userId = await requireUserId();
  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    notFound();
  }

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
  );
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
  );
  const todayEvents = await listEventsForSpace({
    spaceId: space.id,
    from: startOfToday,
    to: endOfToday,
  });
  const monthParam = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}`;
  const todayDateLabel = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const formatEventTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const truncate = (value: string, maxLength: number) =>
    value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  const todaySummary = (() => {
    if (todayEvents.length === 1) {
      const event = todayEvents[0];
      return {
        text: `${truncate(event.title, 24)}${event.timeIsSet ? ` at ${formatEventTime(event.dateTimeStart)}` : ""}`,
        href: `/events/${event.id}`,
        hasPlans: true,
      };
    }
    if (todayEvents.length > 1) {
      return {
        text: `${todayEvents.length} plans today`,
        href: `/spaces/${space.id}/calendar?month=${monthParam}`,
        hasPlans: true,
      };
    }
    return {
      text: "Nothing planned",
      href: `/spaces/${space.id}/calendar?month=${monthParam}`,
      hasPlans: false,
    };
  })();

  return (
    <div className="min-h-screen">
      <SpaceNav
        spaceId={space.id}
        spaceName={space.name || "Your space"}
        todayDateLabel={todayDateLabel}
        todaySummaryText={todaySummary.text}
        todaySummaryHref={todaySummary.href}
        todayHasPlans={todaySummary.hasPlans}
      />
      <main className="mx-auto flex w-full max-w-[1220px] flex-col gap-10 px-4 pb-12 pt-8 md:px-6 md:pt-10">
        {children}
      </main>
    </div>
  );
}
