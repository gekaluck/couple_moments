"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";

import type { CalendarTimeFormat } from "@/lib/calendar";
import LocalTime from "@/components/time/LocalTime";
import { isSameLocalCalendarDay } from "@/lib/date-time";

type MobileTopBarProps = {
  spaceId: string;
  spaceName: string;
  todayDateIso: string;
  todaySummaryEvents: Array<{
    id: string;
    title: string;
    dateTimeStartIso: string;
    timeIsSet: boolean;
  }>;
  timeFormat?: CalendarTimeFormat;
};

export default function MobileTopBar({
  spaceId,
  spaceName,
  todayDateIso,
  todaySummaryEvents,
  timeFormat = "24h",
}: MobileTopBarProps) {
  const today = new Date(todayDateIso);
  const monthParam = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}`;
  const truncate = (value: string, maxLength: number) =>
    value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;

  const todaysEvents = todaySummaryEvents.filter((event) =>
    isSameLocalCalendarDay(new Date(event.dateTimeStartIso), today),
  );

  const todaySummary = (() => {
    if (todaysEvents.length === 1) {
      const event = todaysEvents[0];
      return {
        label: truncate(event.title, 20),
        href: `/events/${event.id}`,
        hasPlans: true,
        eventStartAt: event.timeIsSet ? event.dateTimeStartIso : null,
      };
    }
    if (todaysEvents.length > 1) {
      return {
        label: `${todaysEvents.length} plans`,
        href: `/spaces/${spaceId}/calendar?month=${monthParam}`,
        hasPlans: true,
        eventStartAt: null,
      };
    }
    return {
      label: "Nothing planned",
      href: `/spaces/${spaceId}/calendar?month=${monthParam}`,
      hasPlans: false,
      eventStartAt: null,
    };
  })();

  return (
    <header className="mobile-top-bar sticky top-0 z-50 md:hidden">
      <div className="flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top,0px),8px)] pb-2">
        <Link href={`/spaces/${spaceId}/calendar`} className="flex items-center gap-2 min-w-0">
          <Image
            src="/duet-logo.png"
            alt="Duet"
            width={300}
            height={88}
            className="h-10 w-auto flex-shrink-0"
            priority
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[var(--accent-strong)] brand-text">
              {spaceName}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <LocalTime
                options={{ month: "short", day: "numeric" }}
                value={todayDateIso}
              />
              <span className="text-[var(--text-tertiary)]">·</span>
              <span
                className={`truncate ${
                  todaySummary.hasPlans
                    ? "text-[var(--action-primary)] font-medium"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {todaySummary.label}
                {todaySummary.eventStartAt ? (
                  <>
                    {" at "}
                    <LocalTime
                      options={{ hour: "numeric", minute: "2-digit" }}
                      timeFormat={timeFormat}
                      value={todaySummary.eventStartAt}
                    />
                  </>
                ) : null}
              </span>
            </div>
          </div>
        </Link>
        <Link
          href={`/spaces/${spaceId}/settings`}
          className="flex-shrink-0 rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-white/80 hover:text-[var(--text-primary)] active:scale-95"
          aria-label="Settings"
        >
          <Settings size={20} strokeWidth={1.8} />
        </Link>
      </div>
    </header>
  );
}
