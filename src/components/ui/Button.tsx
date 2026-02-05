import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonProps = {
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantStyles = {
  primary:
    "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]",
  secondary:
    "border border-[var(--border-light)] bg-white text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)]",
  ghost:
    "border border-[var(--panel-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
  danger: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
};

const sizeStyles = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2 text-xs",
  lg: "px-5 py-2.5 text-sm",
};

export default function Button({
  variant,
  size,
  loading = false,
  fullWidth = false,
  disabled,
  type = "button",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:pointer-events-none";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}
