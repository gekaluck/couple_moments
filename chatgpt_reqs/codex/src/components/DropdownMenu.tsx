"use client";

import { ReactNode } from "react";

type MenuItem = {
  label: string;
  action: () => void;
  danger?: boolean;
};

type DropdownMenuProps = {
  children: ReactNode;
  items?: MenuItem[];
};

const DEFAULT_ITEMS: MenuItem[] = [
  { label: "Edit", action: () => {} },
  { label: "Duplicate", action: () => {} },
  { label: "Delete", action: () => {}, danger: true },
];

export function DropdownMenu({ children, items = [] }: DropdownMenuProps) {
  const menuItems = items.length > 0 ? items : DEFAULT_ITEMS;

  return (
    <details className="relative inline-block text-left">
      <summary className="list-none">{children}</summary>
      <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-[var(--shadow-lg)] ring-1 ring-black/5 animate-slide-down">
        <div className="p-1">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.danger
                  ? "text-[#b42318] hover:bg-[#fef3f2]"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              }`}
              onClick={(event) => {
                event.preventDefault();
                item.action();
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
