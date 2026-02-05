"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  id: string;
  label: string;
  href: string;
};

type SpaceNavProps = {
  spaceId: string;
  spaceName: string;
};

const navItems = (spaceId: string): NavItem[] => [
  { id: "calendar", label: "Calendar", href: `/spaces/${spaceId}/calendar` },
  { id: "memories", label: "Memories", href: `/spaces/${spaceId}/memories` },
  { id: "notes", label: "Notes", href: `/spaces/${spaceId}/notes` },
  { id: "activity", label: "Activity", href: `/spaces/${spaceId}/activity` },
  { id: "settings", label: "Settings", href: `/spaces/${spaceId}/settings` },
];

export default function SpaceNav({ spaceId, spaceName }: SpaceNavProps) {
  const pathname = usePathname();
  const items = navItems(spaceId);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;
  const monthParam = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}`;

  return (
    <nav className="site-nav sticky top-0 z-50 border-b border-[var(--border-light)] bg-white/80 backdrop-blur-md shadow-[var(--shadow-sm)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/spaces/${spaceId}/calendar`} className="flex-shrink-0 -my-4">
            <Image
              src="/duet-logo.png"
              alt="Duet"
              width={300}
              height={88}
              className="h-20 w-auto drop-shadow-lg transition-transform hover:scale-105"
              priority
            />
          </Link>
          <p className="text-lg font-semibold text-transparent bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text brand-text">
            {spaceName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="mx-1 h-6 w-px bg-[var(--border-medium)]" />
          <Link
            className="rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm transition hover:border-rose-300 hover:text-rose-600"
            href={`/spaces/${spaceId}/calendar?month=${monthParam}&new=${todayKey}`}
          >
            + Event
          </Link>
          <Link
            className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
            href={`/spaces/${spaceId}/calendar?action=idea`}
          >
            + Idea
          </Link>
          <span className="mx-1 h-6 w-px bg-[var(--border-medium)]" />
          <form action="/api/auth/logout" method="post">
            <button
              className="rounded-full border border-[var(--border-medium)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-white hover:text-[var(--text-primary)]"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
