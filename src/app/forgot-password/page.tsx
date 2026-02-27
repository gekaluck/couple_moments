"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message ?? "Something went wrong. Please try again.");
          return;
        }
        setSent(true);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <main className="surface w-full max-w-md p-10">
        <Image
          src="/duet-logo.png"
          alt="Duet"
          width={300}
          height={88}
          className="mx-auto h-24 w-auto"
          priority
        />
        <h1 className="mt-6 text-center text-3xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
          Reset your password
        </h1>

        {sent ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="font-semibold">Check your email</p>
            <p className="mt-1">
              If that address is registered, we sent you a reset link. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div aria-live="polite" className="mt-4 min-h-6">
              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </div>
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
                Email
                <input
                  className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>
              <button
                className="mt-2 rounded-full bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent)] disabled:opacity-60"
                type="submit"
                disabled={isPending}
              >
                {isPending ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          <a
            className="font-semibold text-[var(--accent-strong)]"
            href="/login"
          >
            Back to login
          </a>
        </p>
      </main>
    </div>
  );
}
