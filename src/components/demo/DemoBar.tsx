"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import OnboardingTour from "@/components/onboarding/OnboardingTour";

type DemoBarProps = {
  spaceId: string;
};

/**
 * Persistent demo notice.
 *
 * Deliberately replaces `BetaNoticeBar` rather than stacking with it — two
 * banners was exactly the first-screen problem the beta bar was already trimmed
 * for. Not dismissible: a visitor who forgets this is a demo may take the
 * content for real data.
 */
export default function DemoBar({ spaceId }: DemoBarProps) {
  const [isTourOpen, setIsTourOpen] = useState(false);

  return (
    <>
      <section className="animate-fade-in-up rounded-2xl border border-rose-200/90 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,247,237,0.9))] px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[var(--accent-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--accent-strong)]">
                Demo space — everything here is made up
              </p>
              {/* Secondary line is desktop-only: on a phone this bar sits above
                  the fold on every tab. */}
              <p className="hidden text-xs text-rose-900/80 sm:block">
                Change anything you like. This sandbox is yours and disappears within a day.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="hidden min-h-10 rounded-full border border-rose-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--accent-strong)] transition hover:bg-rose-50 sm:inline-flex sm:items-center"
            >
              How it works
            </button>
            <Link
              href="/register"
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--accent-strong)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
            >
              Create your space
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        {/* On mobile the tour entry point moves below the row so the two
            controls never squeeze each other out. */}
        <button
          type="button"
          onClick={() => setIsTourOpen(true)}
          className="mt-2 w-full rounded-full border border-rose-300 bg-white/90 px-3 py-2 text-xs font-semibold text-[var(--accent-strong)] transition hover:bg-rose-50 sm:hidden"
        >
          How Duet works
        </button>
      </section>

      {isTourOpen ? (
        <OnboardingTour
          spaceId={spaceId}
          forceOpen
          autoOpen={false}
          onClose={() => setIsTourOpen(false)}
        />
      ) : null}
    </>
  );
}
