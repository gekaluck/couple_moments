"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  success?: boolean;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export default function FormField({
  label,
  htmlFor,
  error,
  success,
  hint,
  required,
  children,
}: FormFieldProps) {
  const hasError = Boolean(error);
  const hasSuccess = success && !hasError;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[var(--text-primary)]"
      >
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <div className="relative">
        {children}
        {(hasError || hasSuccess) && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            {hasError && (
              <AlertCircle className="h-4 w-4 text-[var(--error)]" />
            )}
            {hasSuccess && (
              <CheckCircle className="h-4 w-4 text-[var(--success)]" />
            )}
          </div>
        )}
      </div>
      {hasError && (
        <p className="field-error">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {hint && !hasError && (
        <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  success?: boolean;
};

export function Input({ error, success, className = "", ...props }: InputProps) {
  const stateClass = error
    ? "input-error"
    : success
      ? "input-success"
      : "";

  return (
    <input
      className={`w-full rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] ${stateClass} ${className}`}
      {...props}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
  success?: boolean;
};

export function Textarea({
  error,
  success,
  className = "",
  ...props
}: TextareaProps) {
  const stateClass = error
    ? "input-error"
    : success
      ? "input-success"
      : "";

  return (
    <textarea
      className={`w-full rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] ${stateClass} ${className}`}
      {...props}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
  success?: boolean;
};

export function Select({
  error,
  success,
  className = "",
  children,
  ...props
}: SelectProps) {
  const stateClass = error
    ? "input-error"
    : success
      ? "input-success"
      : "";

  return (
    <select
      className={`w-full rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] ${stateClass} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
