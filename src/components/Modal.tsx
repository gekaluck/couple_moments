"use client";

import { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-250"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-180"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.38),rgba(15,23,42,0.58))] backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-250"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-180"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-[32px] border border-white/70 bg-[rgba(255,255,255,0.93)] p-6 text-left shadow-[var(--shadow-xl)] backdrop-blur-xl md:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(120deg,rgba(251,207,232,0.32),rgba(186,230,253,0.28),rgba(254,243,199,0.26))]"
                />
                {title ? (
                  <div className="relative mb-4 flex items-center justify-between">
                    <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)] md:text-xl">
                      {title}
                    </Dialog.Title>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white/85 text-[var(--text-muted)] transition hover:border-[var(--border-medium)] hover:bg-white hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/35"
                      aria-label="Close modal"
                      onClick={onClose}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
