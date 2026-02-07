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
    <section className="surface p-6 md:p-8">
      <p className="section-kicker">Support</p>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-200/80 bg-violet-50/90 text-violet-700">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Help & Onboarding
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Learn how to use Duet
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="flex items-center justify-between rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3">
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Welcome Tour
            </span>
            <p className="text-xs text-[var(--text-muted)]">
              Restart the introductory walkthrough
            </p>
          </div>
          <button
            onClick={handleRestartTour}
            disabled={isResetting}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--action-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--action-primary-strong)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/40"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Restarting..." : "Restart Tour"}
          </button>
        </div>
      </div>
    </section>
  );
}
