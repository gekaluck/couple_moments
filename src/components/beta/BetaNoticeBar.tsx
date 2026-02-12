"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FlaskConical, MessageSquareWarning, X } from "lucide-react";

const BETA_NOTICE_VERSION = "v1";

type BetaNoticeBarProps = {
  spaceId: string;
};

export default function BetaNoticeBar({ spaceId }: BetaNoticeBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storageKey = `duet_beta_notice_${BETA_NOTICE_VERSION}_${spaceId}`;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(storageKey) === "1";
  });

  const reportHref = useMemo(() => {
    const params = searchParams.toString();
    const from = params ? `${pathname}?${params}` : pathname;
    return `/feedback?from=${encodeURIComponent(from)}&spaceId=${encodeURIComponent(spaceId)}`;
  }, [pathname, searchParams, spaceId]);

  if (dismissed) {
    return null;
  }

  return (
    <section className="animate-fade-in-up rounded-2xl border border-amber-200/90 bg-[linear-gradient(135deg,rgba(255,251,235,0.92),rgba(255,237,213,0.88))] px-4 py-3 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <FlaskConical className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Private Beta</p>
            <p className="text-xs text-amber-800/90">
              Features are stable but still being tuned. Please report anything confusing or broken.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/spaces/${spaceId}/settings#beta-checklist`}
            className="rounded-full border border-amber-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
          >
            Open checklist
          </Link>
          <Link
            href={reportHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800"
          >
            <MessageSquareWarning className="h-3.5 w-3.5" />
            Report issue
          </Link>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.setItem(storageKey, "1");
              }
              setDismissed(true);
            }}
            className="rounded-full border border-amber-300 bg-white/90 p-1.5 text-amber-700 transition hover:bg-amber-50"
            aria-label="Dismiss beta notice"
            title="Dismiss beta notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
