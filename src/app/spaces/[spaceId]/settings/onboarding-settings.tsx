"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, RotateCcw } from "lucide-react";

const STORAGE_KEY = "duet_onboarding_completed";

type OnboardingSettingsProps = {
  spaceId: string;
};

export default function OnboardingSettings({ spaceId }: OnboardingSettingsProps) {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleRestartTour = () => {
    setIsResetting(true);
    // Remove the onboarding completed flag
    localStorage.removeItem(`${STORAGE_KEY}_${spaceId}`);
    // Navigate to calendar to trigger the tour
    router.push(`/spaces/${spaceId}/calendar`);
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
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Welcome Tour
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Re-open the step-by-step walkthrough on calendar and planning.
            </p>
          </div>
          <button
            onClick={handleRestartTour}
            disabled={isResetting}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--action-primary)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--action-primary-strong)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/40"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Restarting..." : "Restart tour"}
          </button>
        </div>

        <div className="grid gap-2 text-xs text-[var(--text-tertiary)] md:grid-cols-3">
          <div className="rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2">
            Calendar cues
          </div>
          <div className="rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2">
            Planning flow
          </div>
          <div className="rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-2">
            Shared rituals
          </div>
        </div>
      </div>
    </section>
  );
}
