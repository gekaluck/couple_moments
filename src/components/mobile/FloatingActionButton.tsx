"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, CalendarPlus, Lightbulb } from "lucide-react";

type FloatingActionButtonProps = {
  spaceId: string;
};

export default function FloatingActionButton({ spaceId }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;
  const monthParam = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}`;

  const createItems = [
    {
      id: "event",
      label: "Event",
      href: `/spaces/${spaceId}/calendar?month=${monthParam}&new=${todayKey}`,
      icon: CalendarPlus,
      bgClass: "bg-rose-500",
      textClass: "text-white",
    },
    {
      id: "idea",
      label: "Idea",
      href: `/spaces/${spaceId}/calendar?action=idea`,
      icon: Lightbulb,
      bgClass: "bg-amber-500",
      textClass: "text-white",
    },
  ];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fab-backdrop md:hidden" onClick={() => setIsOpen(false)} />
      )}
      <div
        ref={menuRef}
        className="fixed right-4 z-50 md:hidden"
        style={{ bottom: "calc(68px + env(safe-area-inset-bottom, 8px) + 12px)" }}
      >
        {/* Expanded menu items */}
        {isOpen && (
          <div className="mb-3 flex flex-col items-end gap-2 animate-scale-in origin-bottom-right">
            {createItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 rounded-full ${item.bgClass} px-4 py-2.5 shadow-[var(--shadow-md)] transition active:scale-95`}
                >
                  <Icon size={18} className={item.textClass} strokeWidth={2} />
                  <span className={`text-sm font-semibold ${item.textClass}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* FAB button */}
        <button
          type="button"
          aria-label={isOpen ? "Close create menu" : "Create new item"}
          className={`fab ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--action-primary)] text-white shadow-[var(--shadow-lg)] transition-transform duration-200 active:scale-95 ${
            isOpen ? "rotate-45" : ""
          }`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
