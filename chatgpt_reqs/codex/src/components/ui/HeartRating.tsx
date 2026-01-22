"use client";

import { useState } from "react";

type HeartRatingProps = {
  value: number | null;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.22 2.53C11.09 5.01 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeartRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: HeartRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value ?? 0;
  const sizeClass = SIZES[size];

  return (
    <div
      className={`inline-flex items-center gap-1 ${readonly ? "" : "cursor-pointer"}`}
      onMouseLeave={() => !readonly && setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={readonly}
          className={`transition-transform ${
            readonly
              ? "cursor-default"
              : "hover:scale-110 focus:outline-none focus:scale-110"
          } ${rating <= displayValue ? "text-rose-500" : "text-slate-300"}`}
          onMouseEnter={() => !readonly && setHoverValue(rating)}
          onClick={() => onChange?.(rating)}
          aria-label={`Rate ${rating} heart${rating > 1 ? "s" : ""}`}
        >
          <HeartIcon filled={rating <= displayValue} className={sizeClass} />
        </button>
      ))}
      {value !== null && !readonly && (
        <span className="ml-2 text-xs text-[var(--text-tertiary)]">
          {value}/5
        </span>
      )}
    </div>
  );
}
