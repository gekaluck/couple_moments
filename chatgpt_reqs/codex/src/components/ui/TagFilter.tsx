"use client";

import { X } from "lucide-react";

type TagFilterProps = {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  variant?: "amber" | "rose" | "emerald" | "sky" | "violet" | "slate";
};

const variantStyles = {
  amber: {
    base: "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
    inactive: "bg-amber-100 text-amber-700 border-amber-200",
  },
  rose: {
    base: "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
    inactive: "bg-rose-100 text-rose-700 border-rose-200",
  },
  emerald: {
    base: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
    inactive: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  sky: {
    base: "bg-gradient-to-r from-sky-500 to-blue-600 text-white",
    inactive: "bg-sky-100 text-sky-700 border-sky-200",
  },
  violet: {
    base: "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
    inactive: "bg-violet-100 text-violet-700 border-violet-200",
  },
  slate: {
    base: "bg-gradient-to-r from-slate-500 to-slate-600 text-white",
    inactive: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export default function TagFilter({
  label,
  isActive = false,
  onClick,
  onRemove,
  variant = "amber",
}: TagFilterProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={`tag-filter ${isActive ? styles.base : `${styles.inactive} border`} ${isActive ? "tag-filter-active" : ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white/80" : "bg-current opacity-50"}`} />
      <span>{label}</span>
      {onRemove && isActive && (
        <button
          type="button"
          aria-label={`Remove ${label} filter`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-white/20"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
