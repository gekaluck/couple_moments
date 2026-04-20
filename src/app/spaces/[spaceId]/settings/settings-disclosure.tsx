"use client";

import { ReactNode, useId, useState } from "react";
import { ChevronRight } from "lucide-react";

type Props = {
  icon: ReactNode;
  label: string;
  previewValue?: string | null;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export default function SettingsDisclosure({
  icon,
  label,
  previewValue,
  description,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <div className="md:py-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-[var(--surface-50)] md:hidden"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--text-muted)]">
          {icon}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
        {previewValue ? (
          <span className="max-w-[50%] truncate text-xs text-[var(--text-tertiary)]">
            {previewValue}
          </span>
        ) : null}
        <ChevronRight
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ease-out ${open ? "rotate-90" : ""}`}
        />
      </button>
      <div className="hidden md:block md:px-6 md:pt-6 lg:px-8 lg:pt-8">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          {label}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
      <div
        id={bodyId}
        role="region"
        aria-label={label}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out md:!grid-rows-[1fr] md:overflow-visible ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0">
          <div className="border-t border-[var(--panel-border)] px-4 pb-4 pt-4 md:border-0 md:px-6 md:pb-6 md:pt-4 lg:px-8 lg:pb-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
