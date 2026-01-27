import type { ReactNode } from "react";

type SectionHeaderProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  variant?: "default" | "rose" | "amber" | "emerald" | "sky" | "violet";
};

const iconBgVariants = {
  default: "from-slate-500 to-slate-600",
  rose: "from-rose-500 to-pink-600",
  amber: "from-amber-500 to-orange-600",
  emerald: "from-emerald-500 to-teal-600",
  sky: "from-sky-500 to-blue-600",
  violet: "from-violet-500 to-purple-600",
};

export default function SectionHeader({
  icon,
  title,
  subtitle,
  action,
  variant = "default",
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      {icon && (
        <div
          className={`section-header-icon bg-gradient-to-br ${iconBgVariants[variant]}`}
        >
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
