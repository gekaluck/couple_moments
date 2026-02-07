"use client";

import { useEffect, useRef, useState } from "react";
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const createButtonRef = useRef<HTMLButtonElement | null>(null);
  const createItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;
  const monthParam = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}`;
  const createItems = [
    {
      id: "event",
      label: "+ Event",
      href: `/spaces/${spaceId}/calendar?month=${monthParam}&new=${todayKey}`,
      dotClassName: "bg-rose-500",
      textClassName: "text-rose-700 hover:bg-rose-50",
    },
    {
      id: "idea",
      label: "+ Idea",
      href: `/spaces/${spaceId}/calendar?action=idea`,
      dotClassName: "bg-amber-500",
      textClassName: "text-amber-700 hover:bg-amber-50",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!createMenuRef.current?.contains(event.target as Node)) {
        setIsCreateOpen(false);
      }
    };
    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      setIsCreateOpen(false);
      createButtonRef.current?.focus();
    };

    if (isCreateOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscClose);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscClose);
    };
  }, [isCreateOpen]);

  useEffect(() => {
    if (!isCreateOpen) {
      return;
    }
    requestAnimationFrame(() => {
      createItemRefs.current[0]?.focus();
    });
  }, [isCreateOpen]);

  const focusCreateItem = (index: number) => {
    const clampedIndex =
      index < 0
        ? createItems.length - 1
        : index >= createItems.length
          ? 0
          : index;
    createItemRefs.current[clampedIndex]?.focus();
  };

  return (
    <nav className="site-nav sticky top-4 z-50 px-4">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 rounded-[28px] border border-[var(--panel-border)] bg-[rgba(255,255,255,0.82)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/spaces/${spaceId}/calendar`} className="flex-shrink-0 -my-3">
            <Image
              src="/duet-logo.png"
              alt="Duet"
              width={300}
              height={88}
              className="h-16 w-auto transition-transform duration-200 hover:scale-[1.03]"
              priority
            />
          </Link>
          <p className="max-w-[240px] truncate text-lg font-semibold tracking-[-0.015em] text-[var(--accent-strong)] brand-text">
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
                    ? "bg-[var(--action-primary)] text-white shadow-[var(--shadow-md)]"
                    : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="mx-1 hidden h-6 w-px bg-[var(--border-medium)] md:block" />
          <div className="relative" ref={createMenuRef}>
            <button
              ref={createButtonRef}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isCreateOpen
                  ? "border-[var(--action-primary)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[var(--panel-border)] bg-white/90 text-[var(--text-primary)] hover:border-[var(--border-medium)] hover:bg-white"
              }`}
              type="button"
              aria-expanded={isCreateOpen}
              aria-haspopup="menu"
              aria-controls="create-nav-menu"
              onClick={() => setIsCreateOpen((prev) => !prev)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsCreateOpen(true);
                }
              }}
            >
              + Create
            </button>
            {isCreateOpen ? (
              <div
                id="create-nav-menu"
                role="menu"
                aria-label="Create options"
                className="animate-scale-in absolute right-0 top-[calc(100%+10px)] z-[70] w-44 origin-top-right rounded-2xl border border-[var(--panel-border)] bg-white/95 p-2 shadow-[var(--shadow-md)] backdrop-blur-xl"
              >
                {createItems.map((item, index) => (
                  <Link
                    key={item.id}
                    ref={(element) => {
                      createItemRefs.current[index] = element;
                    }}
                    role="menuitem"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/30 ${item.textClassName} ${index > 0 ? "mt-1" : ""}`}
                    href={item.href}
                    onClick={() => setIsCreateOpen(false)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        focusCreateItem(index + 1);
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        focusCreateItem(index - 1);
                      }
                      if (event.key === "Home") {
                        event.preventDefault();
                        focusCreateItem(0);
                      }
                      if (event.key === "End") {
                        event.preventDefault();
                        focusCreateItem(createItems.length - 1);
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setIsCreateOpen(false);
                        createButtonRef.current?.focus();
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    <span className={`h-2 w-2 rounded-full ${item.dotClassName}`} />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <span className="mx-1 hidden h-6 w-px bg-[var(--border-medium)] md:block" />
          <form action="/api/auth/logout" method="post">
            <button
              className="rounded-full border border-[var(--border-medium)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-white hover:text-[var(--text-primary)]"
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
