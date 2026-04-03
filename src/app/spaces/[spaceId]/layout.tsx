import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { listEventsForSpace } from "@/lib/events";
import { resolveCalendarTimeFormat } from "@/lib/calendar";
import BetaNoticeBar from "@/components/beta/BetaNoticeBar";
import SpaceNav from "./space-nav";
import MobileTopBar from "@/components/mobile/MobileTopBar";
import BottomTabBar from "@/components/mobile/BottomTabBar";
import FloatingActionButton from "@/components/mobile/FloatingActionButton";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ spaceId: string }>;
};

export default async function SpaceLayout({ children, params }: LayoutProps) {
  const cookieStore = await cookies();
  const calendarTimeFormat = resolveCalendarTimeFormat(
    cookieStore.get("cm_calendar_time_format")?.value,
  );
  const userId = await requireUserId();
  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    notFound();
  }

  const today = new Date();
  const summaryWindowStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
    0,
    0,
    0,
  );
  const summaryWindowEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
    23,
    59,
    59,
  );
  const todaySummaryEvents = await listEventsForSpace({
    spaceId: space.id,
    from: summaryWindowStart,
    to: summaryWindowEnd,
  });

  const navProps = {
    spaceId: space.id,
    spaceName: space.name || "Your space",
    todayDateIso: today.toISOString(),
    todaySummaryEvents: todaySummaryEvents.map((event) => ({
      id: event.id,
      title: event.title,
      dateTimeStartIso: event.dateTimeStart.toISOString(),
      timeIsSet: event.timeIsSet,
    })),
    timeFormat: calendarTimeFormat,
  };

  return (
    <div className="min-h-screen">
      <MobileTopBar {...navProps} />
      <SpaceNav {...navProps} />
      <div className="mx-auto mt-4 w-full max-w-[1220px] px-3 md:px-6">
        <BetaNoticeBar spaceId={space.id} />
      </div>
      <main className="mx-auto flex w-full max-w-[1220px] flex-col gap-6 overflow-x-hidden px-3 pb-24 pt-4 md:gap-10 md:px-6 md:pb-12 md:pt-10">
        {children}
      </main>
      <FloatingActionButton spaceId={space.id} />
      <BottomTabBar spaceId={space.id} />
    </div>
  );
}

