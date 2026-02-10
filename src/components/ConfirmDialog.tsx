"use client";

import { Fragment, useTransition } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await onConfirm();
        onClose();
      } catch {
        toast.error("Action failed");
      }
    });
  };

  const iconBg = variant === "danger" ? "bg-red-100" : "bg-amber-100";
  const iconColor = variant === "danger" ? "text-red-600" : "text-amber-600";
  const confirmBg =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-amber-600 hover:bg-amber-700";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                  >
                    <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
                      {title}
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {message}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-xl border border-[var(--panel-border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-gray-50"
                    onClick={onClose}
                    disabled={isPending}
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition ${confirmBg} disabled:opacity-50`}
                    onClick={handleConfirm}
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {confirmLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
