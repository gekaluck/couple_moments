"use client";

import { ReactNode } from "react";

type Variant = "ghost" | "danger" | "primary" | "secondary";
type Size = "sm" | "md" | "lg";

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  variant?: Variant;
  size?: Size;
  iconSize?: string;
  className?: string;
  count?: number;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

const VARIANT_CLASS: Record<Variant, string> = {
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  danger: "bg-transparent text-red-600 hover:bg-red-50",
  primary: "bg-rose-500 text-white hover:bg-rose-600",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-8 px-2 text-xs",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4 text-sm",
};

export default function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "sm",
  iconSize,
  className,
  count,
  onClick,
  type = "button",
  disabled,
}: IconButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full font-medium transition ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className ?? ""}`}
      onClick={onClick}
      type={type}
      title={label}
      aria-label={label}
      disabled={disabled}
    >
      <span
        className={`inline-flex items-center justify-center ${iconSize ?? "h-4 w-4"}`}
      >
        {icon}
      </span>
      {typeof count === "number" ? <span>{count}</span> : null}
    </button>
  );
}
