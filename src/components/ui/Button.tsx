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
    "border border-transparent bg-[var(--action-primary)] text-white shadow-[var(--shadow-md)] hover:bg-[var(--action-primary-strong)] hover:shadow-[var(--shadow-lg)]",
  secondary:
    "border border-[var(--panel-border)] bg-white/90 text-[var(--text-primary)] hover:border-[var(--border-medium)] hover:bg-white hover:shadow-[var(--shadow-sm)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-50)] hover:text-[var(--text-primary)]",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
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
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/35";

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
