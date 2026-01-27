import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "rose" | "amber" | "emerald" | "sky" | "violet" | "slate";
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
};

const variantStyles = {
  default: "border-[var(--panel-border)] bg-white/70",
  rose: "border-rose-200 bg-rose-50",
  amber: "border-amber-200 bg-amber-50",
  emerald: "border-emerald-200 bg-emerald-50",
  sky: "border-sky-200 bg-sky-50",
  violet: "border-violet-200 bg-violet-50",
  slate: "border-slate-200 bg-slate-50",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  className = "",
  variant = "default",
  hover = false,
  padding = "md",
  onClick,
}: CardProps) {
  const baseStyles = "rounded-2xl border transition-all duration-200";
  const hoverStyles = hover
    ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-opacity-80"
    : "";
  const interactiveStyles = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}

type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <h3
      className={`min-w-0 flex-1 text-lg font-semibold text-[var(--text-primary)] line-clamp-2 break-words overflow-hidden ${className}`}
    >
      {children}
    </h3>
  );
}

type CardDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function CardDescription({
  children,
  className = "",
}: CardDescriptionProps) {
  return (
    <p className={`mt-2 text-sm text-[var(--text-muted)] line-clamp-2 ${className}`}>
      {children}
    </p>
  );
}

type CardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div
      className={`mt-3 flex flex-wrap items-center justify-between gap-2 ${className}`}
    >
      {children}
    </div>
  );
}

type CardActionsProps = {
  children: ReactNode;
  className?: string;
};

export function CardActions({ children, className = "" }: CardActionsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}
