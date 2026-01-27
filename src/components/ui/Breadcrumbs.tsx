"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  showHome?: boolean;
  homeHref?: string;
};

export default function Breadcrumbs({
  items,
  showHome = false,
  homeHref = "/",
}: BreadcrumbsProps) {
  const allItems = showHome
    ? [{ label: "Home", href: homeHref }, ...items]
    : items;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isHome = showHome && index === 0;

        return (
          <div key={`${item.label}-${index}`} className="breadcrumb-item">
            {index > 0 && (
              <ChevronRight
                className="breadcrumb-separator h-4 w-4"
                aria-hidden="true"
              />
            )}
            {isLast ? (
              <span className="breadcrumb-current">{item.label}</span>
            ) : item.href ? (
              <Link href={item.href} className="breadcrumb-link">
                {isHome ? (
                  <span className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    <span className="sr-only">{item.label}</span>
                  </span>
                ) : (
                  item.label
                )}
              </Link>
            ) : (
              <span className="breadcrumb-link">{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
