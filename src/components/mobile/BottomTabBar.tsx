"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, Camera, Activity } from "lucide-react";

type Tab = {
  id: string;
  label: string;
  href: string;
  icon: typeof CalendarDays;
};

const tabs = (spaceId: string): Tab[] => [
  { id: "calendar", label: "Calendar", href: `/spaces/${spaceId}/calendar`, icon: CalendarDays },
  { id: "memories", label: "Memories", href: `/spaces/${spaceId}/memories`, icon: Camera },
  { id: "activity", label: "Activity", href: `/spaces/${spaceId}/activity`, icon: Activity },
];

export default function BottomTabBar({ spaceId }: { spaceId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const items = tabs(spaceId);
  const isMemoryEvent =
    pathname.startsWith("/events/") && searchParams.get("from") === "memories";
  const calendarIsActive =
    pathname.startsWith(`/spaces/${spaceId}/calendar`) ||
    pathname.startsWith(`/spaces/${spaceId}/ideas/`) ||
    (pathname.startsWith("/events/") && !isMemoryEvent);

  return (
    <nav className="bottom-tab-bar fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex items-stretch justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
        {items.map((tab) => {
          const isActive =
            tab.id === "calendar"
              ? calendarIsActive
              : tab.id === "memories"
                ? isMemoryEvent || pathname.startsWith(tab.href)
                : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-[var(--action-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                className="transition-transform duration-200"
              />
              <span>{tab.label}</span>
              {isActive && (
                <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--action-primary)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
