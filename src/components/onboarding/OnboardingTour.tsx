"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Lightbulb,
  Camera,
  Heart,
  NotebookText,
  Activity,
  Settings2,
  Link2,
} from "lucide-react";

type OnboardingStep = {
  title: string;
  kicker: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
  color: string;
};

const steps: OnboardingStep[] = [
  {
    title: "Welcome to Duet",
    kicker: "Your shared home",
    description:
      "Duet keeps planning and memory-keeping in one place, so both of you always see the same timeline.",
    highlights: [
      "Calendar is the source of truth.",
      "Ideas and notes stay linked to moments.",
      "Memories preserve what happened after each date.",
    ],
    icon: <Heart className="h-8 w-8" />,
    color: "from-rose-500 to-pink-600",
  },
  {
    title: "Plan Your Dates",
    kicker: "Calendar flow",
    description:
      "Start in Calendar: add events, mark unavailability, and quickly scan your month with partner context.",
    highlights: [
      "Click any day to create an event.",
      "Add availability blocks before booking plans.",
      "Use day cards to jump into event details.",
    ],
    icon: <Calendar className="h-8 w-8" />,
    color: "from-teal-500 to-emerald-600",
  },
  {
    title: "Capture Ideas",
    kicker: "What's ahead",
    description:
      "Use the ideas lane for unscheduled plans, then schedule them in one step when the date is set.",
    highlights: [
      "Store title, notes, and place details.",
      "Comment directly on ideas together.",
      "Convert an idea into a calendar event when ready.",
    ],
    icon: <Lightbulb className="h-8 w-8" />,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Use Notes as your shared context",
    kicker: "Notes center",
    description:
      "Notes are for planning conversations, links, and reminders that should stay close to your upcoming plans.",
    highlights: [
      "Keep practical details out of chat clutter.",
      "Link relevant notes to ideas or events.",
      "Review before a date to avoid last-minute confusion.",
    ],
    icon: <NotebookText className="h-8 w-8" />,
    color: "from-sky-500 to-indigo-600",
  },
  {
    title: "Save memories after each date",
    kicker: "Memories",
    description:
      "Completed events become memories where you can rate the date, add reflections, and keep photo/place history.",
    highlights: [
      "Rate each memory so favorites are easy to revisit.",
      "Keep place and map context attached.",
      "Build a meaningful timeline over time.",
    ],
    icon: <Camera className="h-8 w-8" />,
    color: "from-violet-500 to-purple-600",
  },
  {
    title: "Track momentum in Activity",
    kicker: "Recent updates",
    description:
      "Activity gives both of you visibility into what changed recently: edits, comments, and new planning items.",
    highlights: [
      "Spot partner updates quickly.",
      "Catch up without opening every tab.",
      "Use it as your quick daily sync view.",
    ],
    icon: <Activity className="h-8 w-8" />,
    color: "from-cyan-500 to-blue-600",
  },
  {
    title: "Customize your space in Settings",
    kicker: "Control panel",
    description:
      "Settings lets you tune profile appearance, calendar preferences, partner membership, and Google integration.",
    highlights: [
      "Choose alias, initials, and personal color.",
      "Set week start and 12h/24h time format.",
      "Connect Google Calendar for sync and invites.",
    ],
    icon: <Settings2 className="h-8 w-8" />,
    color: "from-slate-500 to-slate-700",
  },
  {
    title: "You're ready",
    kicker: "First actions",
    description: "Recommended first run: add one idea, schedule one date, and add one note together.",
    highlights: [
      "Create your next date right now.",
      "Open one idea and leave a comment each.",
      "Keep onboarding available in Settings any time.",
    ],
    icon: <Link2 className="h-8 w-8" />,
    color: "from-rose-500 to-fuchsia-600",
  },
];

const STORAGE_KEY = "duet_onboarding_completed";

type OnboardingTourProps = {
  spaceId: string;
  forceOpen?: boolean;
  initialStep?: number;
};

export default function OnboardingTour({
  spaceId,
  forceOpen = false,
  initialStep = 0,
}: OnboardingTourProps) {
  const clampedInitialStep = Math.max(0, Math.min(initialStep, steps.length - 1));
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [currentStep, setCurrentStep] = useState(
    clampedInitialStep,
  );

  const handleComplete = useCallback(() => {
    localStorage.setItem(`${STORAGE_KEY}_${spaceId}`, "true");
    setIsOpen(false);
  }, [spaceId]);

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
    if (forceOpen) {
      return;
    }

    // Check if user has completed onboarding
    const completed = localStorage.getItem(`${STORAGE_KEY}_${spaceId}`);
    if (!completed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceOpen, spaceId]);

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
        <div className={`bg-gradient-to-r ${step.color} px-6 pb-8 pt-7 text-white`}>
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Skip tour"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/35 bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
              Step {currentStep + 1}/{steps.length}
            </span>
            <span className="rounded-full border border-white/35 bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
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

          <div className="mt-5 h-1.5 rounded-full bg-slate-100">
            <div
              className={`h-1.5 rounded-full bg-gradient-to-r ${step.color} transition-all duration-300`}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="mt-4 flex justify-center gap-2">
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

          <p className="mt-3 text-[11px] text-[var(--text-tertiary)]">
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
              onClick={handleNext}
              className={`flex items-center gap-1 rounded-full bg-gradient-to-r ${step.color} px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/40`}
            >
              {isLastStep ? "Start Planning" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
