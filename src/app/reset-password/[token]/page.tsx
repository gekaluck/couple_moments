"use client";

import Image from "next/image";
import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default function ResetPasswordPage({ params }: PageProps) {
  const { token } = use(params);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message ?? "Something went wrong. Please try again.");
          return;
        }
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
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
          Choose a new password
        </h1>

        {done ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="font-semibold">Password updated!</p>
            <p className="mt-1">Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
              Choose a strong password for your account.
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
                New password
                <input
                  className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
                Confirm password
                <input
                  className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <button
                className="mt-2 rounded-full bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent)] disabled:opacity-60"
                type="submit"
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Update password"}
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
