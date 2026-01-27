"use client";

import React from "react";
import { toast } from "sonner";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught error:", error);
    toast.error("Something went wrong. Please refresh.");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-3 px-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
            Something went wrong
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Please refresh the page or try again in a moment.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
