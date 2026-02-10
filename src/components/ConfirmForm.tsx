"use client";

import { ReactNode, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";

type ConfirmFormProps = {
  action: (formData: FormData) => Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
};

export default function ConfirmForm({
  action,
  message,
  children,
  className,
  title = "Confirm action",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  return (
    <>
      <form
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          setPendingFormData(new FormData(event.currentTarget));
          setIsOpen(true);
        }}
      >
        {children}
      </form>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setPendingFormData(null);
        }}
        onConfirm={async () => {
          if (!pendingFormData) {
            return;
          }
          await action(pendingFormData);
          setPendingFormData(null);
        }}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant}
      />
    </>
  );
}
