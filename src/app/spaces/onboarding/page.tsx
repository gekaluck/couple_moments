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
      <main className="flex w-full max-w-5xl flex-col gap-10">
        <header className="surface relative overflow-hidden p-8 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(120deg,rgba(255,226,236,0.36),rgba(255,244,220,0.3),rgba(222,240,255,0.28))]"
          />
          <Image
            src="/duet-logo.png"
            alt="Duet"
            width={300}
            height={88}
            className="relative mx-auto h-16 w-auto"
            priority
          />
          <h1 className="relative mt-4 text-4xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
            Create your cozy space
          </h1>
          <p className="relative mt-2 text-sm text-[var(--text-muted)]">
            One place for planning dates, saving memories, and staying close.
          </p>
          <div className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Space setup
          </div>
          {error ? (
            <p className="relative mx-auto mt-4 max-w-md rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
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
            className="surface flex h-full flex-col gap-6 border border-rose-200/60 bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(255,237,245,0.82))] p-8"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-700">
                New space
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
                Create together
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Start with your own shared space, then invite your partner.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
              Space name (optional)
              <input
                className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                name="name"
                placeholder="Our cozy corner"
                type="text"
              />
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">
              You can rename your space later from Settings.
            </p>
            <button
              className="mt-auto rounded-full bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--accent)]"
              type="submit"
            >
              Create space
            </button>
          </form>

          <form
            action={handleJoin}
            className="surface flex h-full flex-col gap-6 border border-sky-200/60 bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(234,246,255,0.82))] p-8"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                Existing space
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
                Join with invite
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Enter the code your partner shared with you.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
              Invite code
              <input
                className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                name="inviteCode"
                placeholder="Paste invite code"
                type="text"
                defaultValue={invitePrefill}
              />
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">
              Tip: invite codes are case-insensitive and safe to paste directly.
            </p>
            <button
              className="mt-auto rounded-full border border-sky-500 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-sky-700 transition hover:bg-sky-50"
              type="submit"
            >
              Join space
            </button>
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="surface border border-[var(--panel-border)] bg-[linear-gradient(165deg,rgba(255,255,255,0.92),rgba(245,242,255,0.74))] p-8">
            <p className="section-kicker">How Duet Works</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)]">
              One shared home for planning and memory-keeping
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-[var(--text-muted)]">
              Duet is calendar-centric: ideas become plans, plans become memories, and both of
              you can add context as you go.
            </p>

            <ol className="mt-6 grid gap-3 text-sm">
              <li className="rounded-2xl border border-white/90 bg-white/78 p-4 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                  1. Calendar first
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  Add events or unavailability blocks directly from the month view so both of you
                  can see your shared rhythm at a glance.
                </p>
              </li>
              <li className="rounded-2xl border border-white/90 bg-white/78 p-4 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                  2. Capture ideas
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  Drop date ideas in the &quot;What&apos;s ahead&quot; lane, then schedule them when timing feels
                  right.
                </p>
              </li>
              <li className="rounded-2xl border border-white/90 bg-white/78 p-4 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                  3. Keep context
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  Add place details, comments, and notes to plans so details stay attached to the
                  right moment.
                </p>
              </li>
              <li className="rounded-2xl border border-white/90 bg-white/78 p-4 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                  4. Build your memory map
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  Past plans become memories where you can rate, reflect, and revisit favorite
                  experiences.
                </p>
              </li>
            </ol>
          </article>

          <aside className="surface border border-rose-200/60 bg-[linear-gradient(165deg,rgba(255,255,255,0.93),rgba(255,238,245,0.8),rgba(236,247,255,0.76))] p-8">
            <p className="section-kicker">First 5 Minutes</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Release-ready setup checklist
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="rounded-xl border border-white/90 bg-white/78 px-3 py-2">
                Invite your partner and confirm both members appear in Settings.
              </li>
              <li className="rounded-xl border border-white/90 bg-white/78 px-3 py-2">
                Connect Google Calendar to sync events and invitations.
              </li>
              <li className="rounded-xl border border-white/90 bg-white/78 px-3 py-2">
                Add one idea, schedule one event, and create one unavailable block.
              </li>
              <li className="rounded-xl border border-white/90 bg-white/78 px-3 py-2">
                Check Memories and Notes so the whole flow feels clear end-to-end.
              </li>
            </ul>

            <div className="mt-5 rounded-2xl border border-white/90 bg-white/82 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Main Tabs
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                <span className="rounded-lg border border-rose-100 bg-rose-50/80 px-2 py-1">
                  Calendar
                </span>
                <span className="rounded-lg border border-violet-100 bg-violet-50/80 px-2 py-1">
                  Memories
                </span>
                <span className="rounded-lg border border-sky-100 bg-sky-50/80 px-2 py-1">
                  Notes
                </span>
                <span className="rounded-lg border border-amber-100 bg-amber-50/80 px-2 py-1">
                  Activity
                </span>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
