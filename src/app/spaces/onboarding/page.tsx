import Image from "next/image";
import { redirect } from "next/navigation";

import { createCoupleSpaceForUser, joinCoupleSpaceByInvite } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";

type PageProps = {
  searchParams?: Promise<{
    invite?: string;
    error?: string;
  }>;
};

async function handleCreate(formData: FormData) {
  "use server";
  const userId = await requireUserId();
  const name = formData.get("name")?.toString() ?? "";
  const space = await createCoupleSpaceForUser(userId, name.trim() || null);
  redirect(`/spaces/${space.id}/calendar`);
}

async function handleJoin(formData: FormData) {
  "use server";
  const userId = await requireUserId();
  const inviteCode = formData.get("inviteCode")?.toString().trim();
  if (!inviteCode) {
    redirect("/spaces/onboarding?error=Invite%20code%20is%20required.");
  }

  const result = await joinCoupleSpaceByInvite(inviteCode, userId);
  if (result.error || !result.space) {
    redirect(
      `/spaces/onboarding?invite=${encodeURIComponent(inviteCode)}&error=${encodeURIComponent(
        result.error || "Unable to join this space.",
      )}`,
    );
  }

  redirect(`/spaces/${result.space.id}/calendar`);
}

export default async function OnboardingPage({ searchParams }: PageProps) {
  await requireUserId();
  const search = (await searchParams) ?? {};
  const invitePrefill = search.invite ?? "";
  const error = search.error ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-4xl flex-col gap-10">
        <header className="text-center">
          <Image
            src="/duet-logo.png"
            alt="Duet"
            width={300}
            height={88}
            className="mx-auto h-16 w-auto"
            priority
          />
          <h1 className="mt-4 text-4xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
            Create or join your space
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Start planning dates together in minutes.
          </p>
          {error ? (
            <p className="mt-4 rounded-full bg-[#f9e5e2] px-4 py-2 text-sm text-[#a1493d]">
              {error}
            </p>
          ) : null}
        </header>
        <div className="flex justify-center gap-4 text-sm">
          <span className="text-[var(--text-muted)]">Not the right account?</span>
          <form action="/api/auth/logout" method="POST" className="inline">
            <button
              type="submit"
              className="font-semibold text-[var(--accent-strong)] hover:underline"
            >
              Log out
            </button>
          </form>
          <span className="text-[var(--text-muted)]">or</span>
          <a
            href="/login"
            className="font-semibold text-[var(--accent-strong)] hover:underline"
          >
            Sign in as different user
          </a>
        </div>
        <section className="grid gap-6 md:grid-cols-2">
          <form
            action={handleCreate}
            className="surface flex h-full flex-col gap-6 p-8"
          >
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
                Create a new space
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Pick a name that feels like you both.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
              Space name (optional)
              <input
                className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                name="name"
                placeholder="Our cozy corner"
                type="text"
              />
            </label>
            <button
              className="mt-auto rounded-full bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent)]"
              type="submit"
            >
              Create space
            </button>
          </form>
          <form
            action={handleJoin}
            className="surface flex h-full flex-col gap-6 p-8"
          >
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
                Join with an invite
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Enter the code your partner shared.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
              Invite code
              <input
                className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                name="inviteCode"
                placeholder="Paste invite code"
                type="text"
                defaultValue={invitePrefill}
              />
            </label>
            <button
              className="mt-auto rounded-full border border-[var(--accent-strong)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)] transition hover:bg-[#d7e5ed]"
              type="submit"
            >
              Join space
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
