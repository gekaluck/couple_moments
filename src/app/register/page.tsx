import Image from "next/image";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
    email?: string;
    retryAfter?: string;
    redirect?: string;
  }>;
};

function getRegisterErrorMessage(errorCode?: string, retryAfterSeconds?: number | null) {
  if (errorCode === "duplicate-email") {
    return "An account with that email already exists.";
  }
  if (errorCode === "invalid-input") {
    return "Enter a valid email and password.";
  }
  if (errorCode === "rate-limited") {
    if (retryAfterSeconds && retryAfterSeconds > 0) {
      return `Too many signup attempts. Try again in ${retryAfterSeconds}s.`;
    }
    return "Too many signup attempts. Try again shortly.";
  }
  if (errorCode === "ip-unavailable") {
    return "Could not verify your request. Please retry.";
  }
  return null;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const parsedRetryAfter = Number.parseInt(query.retryAfter ?? "", 10);
  const retryAfterSeconds = Number.isFinite(parsedRetryAfter) ? parsedRetryAfter : null;
  const errorMessage = getRegisterErrorMessage(query.error, retryAfterSeconds);
  const emailValue = query.email?.trim() ?? "";
  const redirectTo =
    query.redirect && query.redirect.startsWith("/") && !query.redirect.startsWith("//")
      ? query.redirect
      : "";

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
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
          Start building your space in minutes.
        </p>
        <div aria-live="polite" className="mt-4 min-h-6">
          {errorMessage ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <form
          className="mt-8 flex flex-col gap-4"
          method="post"
          action="/api/auth/register"
        >
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
            Name
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="name"
              type="text"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
            Email
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="email"
              type="email"
              defaultValue={emailValue}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
            Password
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="password"
              type="password"
              required
            />
          </label>
          <button
            className="mt-2 rounded-full bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent)]"
            type="submit"
          >
            Create account
          </button>
        </form>
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <a
            className="font-semibold text-[var(--accent-strong)]"
            href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
          >
            Log in
          </a>
          .
        </p>
      </main>
    </div>
  );
}
