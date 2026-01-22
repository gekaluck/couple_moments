import { redirect } from "next/navigation";

import { getCoupleSpaceForUser, listSpaceMembers } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

import InviteCard from "./invite-card";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

function getInitials(name: string | null | undefined, email: string) {
  const source = (name || email).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function SettingsPage({ params }: PageProps) {
  const userId = await requireUserId();
  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    redirect("/spaces/onboarding");
  }

  const members = await listSpaceMembers(space.id);
  const currentUser = members.find((m) => m.userId === userId);
  const partner = members.find((m) => m.userId !== userId);
  const isSpaceComplete = members.length >= 2;

  // Get full user details
  const currentUserDetails = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return (
    <>
      <section className="surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Space Settings
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Manage your couple space and invite your partner.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isSpaceComplete
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isSpaceComplete ? "Complete" : "Waiting for partner"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {members.length}/2 members
            </span>
          </div>
        </div>
      </section>

      <section className="surface p-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Members
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Current User */}
          <div className="flex items-center gap-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-semibold text-white">
              {getInitials(currentUserDetails?.name, currentUserDetails?.email ?? "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {currentUserDetails?.name || "You"}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {currentUserDetails?.email}
              </p>
              <span className="mt-1 inline-block rounded-full bg-sky-200 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                You
              </span>
            </div>
          </div>

          {/* Partner or Empty Slot */}
          {partner ? (
            <div className="flex items-center gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-semibold text-white">
                {getInitials(partner.user.name, partner.user.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {partner.user.name || "Partner"}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {partner.user.email}
                </p>
                <span className="mt-1 inline-block rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                  Partner
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-400">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500">
                  Waiting for partner
                </p>
                <p className="text-xs text-slate-400">
                  Share the invite link below
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {!isSpaceComplete && (
        <InviteCard spaceId={space.id} inviteCode={space.inviteCode} />
      )}

      <section className="surface p-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Space Info
        </h3>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-[var(--text-muted)]">Space Name</span>
            <span className="font-medium text-[var(--text-primary)]">
              {space.name || "Our Space"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-[var(--text-muted)]">Created</span>
            <span className="font-medium text-[var(--text-primary)]">
              {space.createdAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-[var(--text-muted)]">Status</span>
            <span
              className={`font-medium ${
                isSpaceComplete ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isSpaceComplete ? "Complete" : "Pending partner"}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
