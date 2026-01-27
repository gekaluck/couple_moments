"use client";

import { ReactNode } from "react";

type ConfirmFormProps = {
  action: (formData: FormData) => Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
};

export default function ConfirmForm({
  action,
  message,
  children,
  className,
}: ConfirmFormProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
