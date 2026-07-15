"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Camera,
  Heart,
} from "lucide-react";

type OnboardingStep = {
  title: string;
  kicker: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
};

// Three steps, one brand palette. The previous 8-step, five-gradient version
// was a long read on a phone before the user could do anything (FR-2).
const steps: OnboardingStep[] = [
  {
    title: "Welcome to Duet",
    kicker: "Your shared home",
    description:
      "One calendar for the two of you — plans, ideas, and memories all live on the same timeline.",
    highlights: [
      "Both of you always see the same calendar.",
      "Tap any day to add a date or block time.",
    ],
    icon: <Heart className="h-8 w-8" />,
  },
  {
    title: "Ideas become plans",
    kicker: "What's ahead",
    description:
      "Collect date ideas whenever inspiration hits, then schedule them in one tap when the timing works.",
    highlights: [
      "Save a place, notes, and tags with each idea.",
      "Comment on ideas to plan together.",
    ],
    icon: <Lightbulb className="h-8 w-8" />,
  },
  {
    title: "Plans become memories",
    kicker: "Memories",
    description:
      "After each date, the event turns into a memory — add photos, rate it, and revisit your favorites.",
    highlights: [
      "Rate dates so favorites are easy to find.",
      "Photos and places stay attached to the moment.",
    ],
    icon: <Camera className="h-8 w-8" />,
  },
];

const STORAGE_KEY = "duet_onboarding_completed";

type OnboardingTourProps = {
  spaceId: string;
  forceOpen?: boolean;
  initialStep?: number;
  autoOpen?: boolean;
};

export default function OnboardingTour({
  spaceId,
  forceOpen = false,
  initialStep = 0,
  autoOpen = true,
}: OnboardingTourProps) {
  const clampedInitialStep = Math.max(0, Math.min(initialStep, steps.length - 1));
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [currentStep, setCurrentStep] = useState(
    clampedInitialStep,
  );
  const router = useRouter();

  const handleComplete = useCallback(() => {
    localStorage.setItem(`${STORAGE_KEY}_${spaceId}`, "true");
    setIsOpen(false);
  }, [spaceId]);

  // Finishing the tour drops the user straight into adding their first idea —
  // the lowest-friction first action for a newly joined partner.
  const handleFinish = useCallback(() => {
    handleComplete();
    router.push(`/spaces/${spaceId}/calendar?action=idea`);
  }, [handleComplete, router, spaceId]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  useEffect(() => {
    if (forceOpen || !autoOpen) {
      return;
    }

    // Check if user has completed onboarding
    const completed = localStorage.getItem(`${STORAGE_KEY}_${spaceId}`);
    if (!completed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceOpen, spaceId, autoOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleSkip();
      }
      if (event.key === "ArrowRight") {
        handleNext();
      }
      if (event.key === "ArrowLeft") {
        handlePrev();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev, handleSkip, isOpen]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.32),rgba(2,6,23,0.62))] backdrop-blur-sm animate-fade-in-up">
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="bg-hero px-6 pb-8 pt-7 text-white">
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Skip tour"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/35 bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              Step {currentStep + 1}/{steps.length}
            </span>
            <span className="rounded-full border border-white/35 bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              {step.kicker}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <div className="rounded-2xl border border-white/35 bg-white/20 p-4">
              {step.icon}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
            {step.title}
          </h2>
          <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
            {step.description}
          </p>

          <ul className="mt-4 space-y-2 text-left">
            {step.highlights.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-[var(--text-secondary)]"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex justify-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-6 bg-[var(--action-primary)]"
                    : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Keyboard advice is meaningless on touch devices */}
          <p className="mt-3 hidden text-[11px] text-[var(--text-tertiary)] md:block">
            Tip: Use <span className="font-semibold">←</span>/<span className="font-semibold">→</span> to
            navigate and <span className="font-semibold">Esc</span> to close.
          </p>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-slate-100 hover:text-[var(--text-primary)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text-muted)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={isLastStep ? handleFinish : handleNext}
              className="flex min-h-11 items-center gap-1 rounded-full bg-cta px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/40"
            >
              {isLastStep ? "Add your first idea" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
