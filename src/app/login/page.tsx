import Image from "next/image";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
    email?: string;
    retryAfter?: string;
  }>;
};

function getLoginErrorMessage(errorCode?: string, retryAfterSeconds?: number | null) {
  if (errorCode === "invalid-credentials") {
    return "Invalid email or password.";
  }
  if (errorCode === "invalid-input") {
    return "Enter a valid email and password.";
  }
  if (errorCode === "rate-limited") {
    if (retryAfterSeconds && retryAfterSeconds > 0) {
      return `Too many login attempts. Try again in ${retryAfterSeconds}s.`;
    }
    return "Too many login attempts. Try again shortly.";
  }
  if (errorCode === "ip-unavailable") {
    return "Could not verify your request. Please retry.";
  }
  return null;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const parsedRetryAfter = Number.parseInt(query.retryAfter ?? "", 10);
  const retryAfterSeconds = Number.isFinite(parsedRetryAfter) ? parsedRetryAfter : null;
  const errorMessage = getLoginErrorMessage(query.error, retryAfterSeconds);
  const emailValue = query.email?.trim() ?? "";

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
          Welcome back
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
          Log in to plan dates and relive memories.
        </p>
        <div aria-live="polite" className="mt-4 min-h-6">
          {errorMessage ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <form className="mt-8 flex flex-col gap-4" method="post" action="/api/auth/login">
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
            Log in
          </button>
        </form>
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          New here?{" "}
          <a className="font-semibold text-[var(--accent-strong)]" href="/register">
            Create an account
          </a>
          .
        </p>
      </main>
    </div>
  );
}
