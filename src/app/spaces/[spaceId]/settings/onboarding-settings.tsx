"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  RotateCcw,
  CalendarDays,
  NotebookText,
  Camera,
  Settings2,
} from "lucide-react";

import BetaChecklist from "@/components/beta/BetaChecklist";

const STORAGE_KEY = "duet_onboarding_completed";

type OnboardingSettingsProps = {
  spaceId: string;
};

export default function OnboardingSettings({ spaceId }: OnboardingSettingsProps) {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleRestartTour = () => {
    setIsResetting(true);
    localStorage.removeItem(`${STORAGE_KEY}_${spaceId}`);
    router.push(`/spaces/${spaceId}/calendar?tour=1&tourStep=0`);
  };

  const openGuideStep = (step: number) => {
    router.push(`/spaces/${spaceId}/calendar?tour=1&tourStep=${step}`);
  };

  return (
    <section className="surface border border-violet-200/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(238,232,255,0.75))] p-6 md:p-8">
      <p className="section-kicker">Support</p>
      <div className="mt-1 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-200/80 bg-violet-50/90 text-violet-700 shadow-[var(--shadow-sm)]">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Help & Onboarding
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Keep the experience discoverable whenever one of you needs a refresher.
            </p>
          </div>
        </div>
        <span className="hidden rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700 md:inline-flex">
          Guided
        </span>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Welcome Tour</p>
            <p className="text-xs text-[var(--text-muted)]">
              Re-open the step-by-step walkthrough to refresh how the full app flow works.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/feedback?from=${encodeURIComponent(`/spaces/${spaceId}/settings`)}&spaceId=${spaceId}`}
              className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              Report issue
            </Link>
            <button
              type="button"
              onClick={handleRestartTour}
              disabled={isResetting}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--action-primary)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--action-primary-strong)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/40"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
              {isResetting ? "Restarting..." : "Restart tour"}
            </button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <button
            type="button"
            onClick={() => openGuideStep(1)}
            className="inline-flex items-center justify-between rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2 text-left text-xs text-[var(--text-tertiary)] transition hover:border-violet-300 hover:bg-violet-100/70"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-violet-700" />
              Calendar and planning flow
            </span>
            <span>Step 2</span>
          </button>
          <button
            type="button"
            onClick={() => openGuideStep(3)}
            className="inline-flex items-center justify-between rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2 text-left text-xs text-[var(--text-tertiary)] transition hover:border-violet-300 hover:bg-violet-100/70"
          >
            <span className="inline-flex items-center gap-2">
              <NotebookText className="h-3.5 w-3.5 text-violet-700" />
              Notes workflow
            </span>
            <span>Step 4</span>
          </button>
          <button
            type="button"
            onClick={() => openGuideStep(4)}
            className="inline-flex items-center justify-between rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2 text-left text-xs text-[var(--text-tertiary)] transition hover:border-violet-300 hover:bg-violet-100/70"
          >
            <span className="inline-flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-violet-700" />
              Memories and ratings
            </span>
            <span>Step 5</span>
          </button>
          <button
            type="button"
            onClick={() => openGuideStep(6)}
            className="inline-flex items-center justify-between rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2 text-left text-xs text-[var(--text-tertiary)] transition hover:border-violet-300 hover:bg-violet-100/70"
          >
            <span className="inline-flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5 text-violet-700" />
              Settings and integrations
            </span>
            <span>Step 7</span>
          </button>
        </div>

        <div className="grid gap-2 text-xs text-[var(--text-tertiary)] md:grid-cols-3">
          <div className="rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2">
            Calendar -&gt; Ideas -&gt; Events
          </div>
          <div className="rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2">
            Notes + comments context
          </div>
          <div className="rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2">
            Memories + ratings
          </div>
        </div>

        <BetaChecklist spaceId={spaceId} />
      </div>
    </section>
  );
}
