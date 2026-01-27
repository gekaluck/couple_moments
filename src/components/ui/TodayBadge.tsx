"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";

type TodayBadgeProps = {
  href: string;
};

export default function TodayBadge({ href }: TodayBadgeProps) {
  return (
    <Link href={href} className="today-badge group">
      <Calendar className="h-3.5 w-3.5" />
      <span>Today</span>
    </Link>
  );
}
