"use client";

import { ReactNode, useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        type="button"
      />
      <div className="modal-panel relative w-full max-w-xl rounded-3xl border border-[var(--panel-border)] bg-white p-6 shadow-[var(--shadow-xl)] md:p-8">
        {title ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              {title}
            </h2>
            <button
              className="rounded-full border border-[var(--panel-border)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
