import type { HTMLAttributes, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "rose" | "amber" | "emerald" | "sky" | "violet" | "slate";
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "onClick"> & {
  onClick?: () => void;
};

const variantStyles = {
  default: "border-[var(--panel-border)] bg-[var(--color-surface-card)]",
  rose: "border-[var(--panel-border)] bg-[var(--color-surface-card)]",
  amber: "border-[var(--panel-border)] bg-[var(--color-secondary-soft)]",
  emerald: "border-[var(--panel-border)] bg-[var(--surface-50)]",
  sky: "border-[var(--panel-border)] bg-[var(--surface-50)]",
  violet: "border-[var(--panel-border)] bg-[var(--surface-50)]",
  slate: "border-[var(--panel-border)] bg-[var(--surface-50)]",
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
  ...rest
}: CardProps) {
  const baseStyles = "rounded-xl border shadow-[var(--shadow-sm)] transition-all duration-200";
  const hoverStyles = hover
    ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-opacity-95"
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
      {...rest}
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
      className={`min-w-0 flex-1 text-lg font-semibold text-[var(--text-primary)] line-clamp-2 break-all overflow-hidden tracking-[-0.015em] ${className}`}
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
    <p className={`mt-2 text-sm leading-6 text-[var(--text-muted)] line-clamp-2 ${className}`}>
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
