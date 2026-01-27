"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Calendar, Lightbulb, Camera, Heart } from "lucide-react";

type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const steps: OnboardingStep[] = [
  {
    title: "Welcome to Couple Moments",
    description: "Plan dates, save memories, and keep ideas together with your partner. Let's take a quick tour!",
    icon: <Heart className="h-8 w-8" />,
    color: "from-rose-500 to-pink-600",
  },
  {
    title: "Plan Your Dates",
    description: "Use the calendar to schedule upcoming dates. Click any day to add a new event, set the time, and pick a place.",
    icon: <Calendar className="h-8 w-8" />,
    color: "from-teal-500 to-emerald-600",
  },
  {
    title: "Capture Ideas",
    description: "Got a date idea? Save it in the Ideas section. When you're ready, turn any idea into a scheduled event.",
    icon: <Lightbulb className="h-8 w-8" />,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Save Memories",
    description: "After a date, it becomes a memory. Add photos, rate your experience, and look back on your favorite moments together.",
    icon: <Camera className="h-8 w-8" />,
    color: "from-violet-500 to-purple-600",
  },
];

const STORAGE_KEY = "cm_onboarding_completed";

type OnboardingTourProps = {
  spaceId: string;
};

export default function OnboardingTour({ spaceId }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(`${STORAGE_KEY}_${spaceId}`);
    if (!completed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [spaceId]);

  const handleComplete = () => {
    localStorage.setItem(`${STORAGE_KEY}_${spaceId}`, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header gradient */}
        <div className={`bg-gradient-to-r ${step.color} px-6 py-8 text-white`}>
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Skip tour"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-center">
            <div className="rounded-2xl bg-white/20 p-4">
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

          {/* Progress dots */}
          <div className="mt-6 flex justify-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-6 bg-rose-500"
                    : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)] disabled:opacity-30 disabled:hover:text-[var(--text-muted)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              className={`flex items-center gap-1 rounded-full bg-gradient-to-r ${step.color} px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg btn-press`}
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
