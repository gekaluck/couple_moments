export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <main className="surface w-full max-w-md p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--text-muted)]">
          Couple Moments
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Start building your Couple Space in minutes.
        </p>
        <form
          className="mt-8 flex flex-col gap-4"
          method="post"
          action="/api/auth/register"
        >
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
          <a className="font-semibold text-[var(--accent-strong)]" href="/login">
            Log in
          </a>
          .
        </p>
      </main>
    </div>
  );
}
