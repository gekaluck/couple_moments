import Image from "next/image";
import Link from "next/link";

export default function LoggedOutPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="surface w-full rounded-3xl p-8">
        <Image
          src="/duet-logo.png"
          alt="Duet"
          width={300}
          height={88}
          className="mx-auto h-16 w-auto"
          priority
        />
        <h1 className="mt-4 text-2xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
          You are signed out
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Thanks for visiting. Come back anytime to keep planning together.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            className="rounded-full bg-cta px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
            href="/login"
          >
            Log in again
          </Link>
          <Link
            className="text-sm font-semibold text-[var(--action-primary)] transition hover:text-[var(--action-primary-strong)] hover:underline"
            href="/"
          >
            Go to home
          </Link>
        </div>
      </div>
    </main>
  );
}
