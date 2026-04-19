import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CalendarClock, Info, Palette } from "lucide-react";

import {
  getCoupleSpaceForUser,
  leaveCoupleSpace,
  listSpaceMembers,
  removePartnerMembership,
  updateCoupleSpaceName,
  updateMembershipAppearance,
} from "@/lib/couple-spaces";
import {
  buildCreatorVisuals,
  CREATOR_ACCENTS,
  CREATOR_COLOR_OPTIONS,
  getCreatorAccentByKey,
  getAvatarGradient,
  sanitizeMemberAlias,
  sanitizeMemberColor,
  sanitizeMemberInitials,
} from "@/lib/creator-colors";
import { requireUserId } from "@/lib/current-user";
import MutationToast from "@/components/ui/MutationToast";
import LocalTime from "@/components/time/LocalTime";

import InviteCard from "./invite-card";
import MembershipActions from "./membership-actions";
import OnboardingSettings from "./onboarding-settings";
import GoogleCalendarSettings from "./google-calendar-settings";
import SettingsDisclosure from "./settings-disclosure";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const calendarWeekStart =
    cookieStore.get("cm_calendar_week_start")?.value === "monday"
      ? "monday"
      : "sunday";
  const calendarTimeFormat =
    cookieStore.get("cm_calendar_time_format")?.value === "12h"
      ? "12h"
      : "24h";
  const userId = await requireUserId();
  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    redirect("/spaces/onboarding");
  }
  // Store for server actions (avoids TypeScript narrowing issues)
  const spaceIdForActions = space.id;

  const members = await listSpaceMembers(space.id);
  const memberVisuals = buildCreatorVisuals(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      alias: member.alias,
      initials: member.initials,
      color: member.color,
    })),
  );
  const currentMember = members.find((member) => member.userId === userId) ?? null;
  const partner = members.find((m) => m.userId !== userId);
  const currentVisual = memberVisuals[userId];
  const partnerVisual = partner ? memberVisuals[partner.userId] : null;
  const selectedColor =
    sanitizeMemberColor(currentMember?.color ?? null) ?? currentVisual?.accent.key ?? "amber";
  const isSpaceComplete = members.length >= 2;
  const creatorUserId = members[0]?.userId ?? null;
  const isCreator = creatorUserId === userId;
  const canLeave = members.length > 1;

  const colorLabel =
    CREATOR_COLOR_OPTIONS.find((opt) => opt.key === selectedColor)?.label ??
    getCreatorAccentByKey(selectedColor)?.label ??
    selectedColor;
  const profilePreview = currentVisual?.initials
    ? `${colorLabel} · ${currentVisual.initials}`
    : colorLabel;
  const calendarPrefPreview = `${calendarWeekStart === "monday" ? "Mon" : "Sun"} · ${calendarTimeFormat}`;
  const spaceCreatedShort = space.createdAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
  const spaceInfoPreview = `${space.name || "Our Space"} · ${spaceCreatedShort}`;

  async function handleCalendarWeekStart(formData: FormData) {
    "use server";
    const value = formData.get("weekStart")?.toString();
    if (value !== "monday" && value !== "sunday") {
      return;
    }
    const nextCookies = await cookies();
    nextCookies.set("cm_calendar_week_start", value, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    redirect(
      `/spaces/${spaceIdForActions}/settings?toast=${encodeURIComponent("week-start-saved")}`,
    );
  }

  async function handleCalendarTimeFormat(formData: FormData) {
    "use server";
    const value = formData.get("timeFormat")?.toString();
    if (value !== "12h" && value !== "24h") {
      return;
    }
    const nextCookies = await cookies();
    nextCookies.set("cm_calendar_time_format", value, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    redirect(
      `/spaces/${spaceIdForActions}/settings?toast=${encodeURIComponent("time-format-saved")}`,
    );
  }

  async function handleProfileAppearance(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const alias = sanitizeMemberAlias(formData.get("alias")?.toString() ?? null);
    const initials = sanitizeMemberInitials(formData.get("initials")?.toString() ?? null);
    const color = sanitizeMemberColor(formData.get("color")?.toString() ?? null);

    await updateMembershipAppearance({
      coupleSpaceId: spaceIdForActions,
      userId: currentUserId,
      alias,
      initials,
      color,
    });

    redirect(
      `/spaces/${spaceIdForActions}/settings?toast=${encodeURIComponent("profile-style-saved")}`,
    );
  }

  async function handleSpaceName(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const name = formData.get("spaceName")?.toString().trim() ?? "";

    if (!name) {
      return;
    }

    await updateCoupleSpaceName(spaceIdForActions, currentUserId, name);
    revalidatePath(`/spaces/${spaceIdForActions}`, "layout");
    redirect(
      `/spaces/${spaceIdForActions}/settings?toast=${encodeURIComponent("space-name-saved")}`,
    );
  }

  async function handleRemovePartner() {
    "use server";
    const currentUserId = await requireUserId();
    const currentMembers = await listSpaceMembers(spaceIdForActions);
    const currentPartner = currentMembers.find((member) => member.userId !== currentUserId);
    if (!currentPartner) {
      return { ok: false, message: "No partner to remove." };
    }

    try {
      await removePartnerMembership({
        coupleSpaceId: spaceIdForActions,
        actorUserId: currentUserId,
        targetUserId: currentPartner.userId,
      });
      revalidatePath(`/spaces/${spaceIdForActions}/settings`);
      revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
      return { ok: true, message: "Partner removed." };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to remove partner.",
      };
    }
  }

  async function handleLeaveSpace() {
    "use server";
    const currentUserId = await requireUserId();

    try {
      await leaveCoupleSpace({
        coupleSpaceId: spaceIdForActions,
        userId: currentUserId,
      });
      revalidatePath(`/spaces/${spaceIdForActions}/settings`);
      return {
        ok: true,
        message: "You left the space.",
        redirectTo: "/spaces/onboarding",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to leave space.",
      };
    }
  }

  return (
    <div className="min-w-0 w-full">
      <MutationToast
        messages={{
          "profile-style-saved": "Profile style updated.",
          "space-name-saved": "Space name updated.",
          "week-start-saved": "Calendar week start updated.",
          "time-format-saved": "Time format updated.",
        }}
      />
      <section className="surface p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Settings</p>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)]">
              Space Settings
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Fine-tune your shared space and planning preferences.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold shadow-[var(--shadow-sm)] ${
                isSpaceComplete
                  ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                  : "border border-amber-200 bg-amber-100 text-amber-700"
              }`}
            >
              {isSpaceComplete ? "Complete" : "Waiting for partner"}
            </span>
            <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1 text-xs font-medium text-slate-600">
              {members.length}/2 members
            </span>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <section className="surface border border-sky-200/60 bg-[linear-gradient(165deg,rgba(255,255,255,0.92),rgba(236,248,255,0.78))] p-4 md:p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="section-kicker">People</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Members
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  This space works best when both of you are connected.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {members.length}/2 linked
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-white/80 p-2.5 shadow-[var(--shadow-sm)] md:p-4">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(120deg,rgba(125,211,252,0.24),rgba(99,102,241,0.18))]"
                />
                <div className="relative flex items-center gap-2.5 md:gap-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white md:h-12 md:w-12 md:text-sm"
                    style={{
                      backgroundImage: currentVisual
                        ? getAvatarGradient(currentVisual.accent)
                        : getAvatarGradient(CREATOR_ACCENTS.amber),
                    }}
                  >
                    {currentVisual?.initials ?? "ME"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--text-primary)] md:text-sm">
                      {currentVisual?.displayName || "You"}
                    </p>
                    <p className="hidden truncate text-xs text-[var(--text-muted)] md:block">
                      {currentMember?.user.email}
                    </p>
                    <span className="mt-0.5 inline-block rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-sky-700 md:mt-1 md:px-2 md:text-[10px]">
                      You
                    </span>
                  </div>
                </div>
              </div>

              {partner ? (
                <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-white/80 p-2.5 shadow-[var(--shadow-sm)] md:p-4">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(120deg,rgba(251,113,133,0.22),rgba(219,39,119,0.18))]"
                  />
                  <div className="relative flex items-center gap-2.5 md:gap-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white md:h-12 md:w-12 md:text-sm"
                      style={{
                        backgroundImage: partnerVisual
                          ? getAvatarGradient(partnerVisual.accent)
                          : getAvatarGradient(CREATOR_ACCENTS.rose),
                      }}
                    >
                      {partnerVisual?.initials ?? "PA"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[var(--text-primary)] md:text-sm">
                        {partnerVisual?.displayName || "Partner"}
                      </p>
                      <p className="hidden truncate text-xs text-[var(--text-muted)] md:block">
                        {partner.user.email}
                      </p>
                      <span className="mt-0.5 inline-block rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-rose-700 md:mt-1 md:px-2 md:text-[10px]">
                        Partner
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-2.5 md:p-4">
                  <div className="flex items-center gap-2.5 md:gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500 md:h-12 md:w-12">
                      <svg
                        className="h-5 w-5 md:h-6 md:w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-amber-800 md:text-sm">
                        Waiting for partner
                      </p>
                      <p className="hidden text-xs text-amber-700/80 md:block">
                        Share the invite below to activate your full space.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <InviteCard inviteCode={space.inviteCode} isSpaceComplete={isSpaceComplete} />

          <div className="surface overflow-hidden border border-[var(--panel-border)] bg-[linear-gradient(165deg,rgba(255,255,255,0.9),rgba(248,249,252,0.8))]">
            <SettingsDisclosure
              icon={<Info className="h-4 w-4" />}
              label="Space info"
              previewValue={spaceInfoPreview}
              description="Details about your shared space."
            >
              <div className="grid gap-3 text-sm">
                <div className="rounded-xl border border-[var(--panel-border)] bg-white/80 px-4 py-3">
                  <span className="block text-xs uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    Space name
                  </span>
                  <form action={handleSpaceName} className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      name="spaceName"
                      defaultValue={space.name || "Our Space"}
                      maxLength={80}
                      className="w-full rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--action-primary)]"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--action-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--action-primary-strong)]"
                    >
                      Save name
                    </button>
                  </form>
                </div>
                <div className="rounded-xl border border-[var(--panel-border)] bg-white/80 px-4 py-3">
                  <span className="block text-xs uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    Created
                  </span>
                  <LocalTime
                    className="mt-1 block font-semibold text-[var(--text-primary)]"
                    options={{
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }}
                    value={space.createdAt}
                  />
                </div>
                <div className="rounded-xl border border-[var(--panel-border)] bg-white/80 px-4 py-3">
                  <span className="block text-xs uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    Relationship rhythm
                  </span>
                  <span
                    className={`mt-1 block font-semibold ${
                      isSpaceComplete ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {isSpaceComplete ? "Shared planning active" : "Waiting for second member"}
                  </span>
                </div>
              </div>
            </SettingsDisclosure>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="surface overflow-hidden">
            <SettingsDisclosure
              icon={<Palette className="h-4 w-4" />}
              label="Your profile style"
              previewValue={profilePreview}
              description="Set how your name, initials, and color appear across comments and unavailable blocks."
            >
              <form action={handleProfileAppearance} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Alias
                    </span>
                    <input
                      type="text"
                      name="alias"
                      maxLength={32}
                      defaultValue={currentMember?.alias ?? ""}
                      placeholder={currentMember?.user.name ?? "Your display name"}
                      className="w-full rounded-xl border border-[var(--panel-border)] bg-white/80 px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--action-primary)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Initials
                    </span>
                    <input
                      type="text"
                      name="initials"
                      maxLength={2}
                      defaultValue={currentMember?.initials ?? ""}
                      placeholder={currentVisual?.initials ?? "ME"}
                      className="w-full rounded-xl border border-[var(--panel-border)] bg-white/80 px-3 py-2 text-sm uppercase tracking-[0.08em] text-[var(--text-primary)] outline-none transition focus:border-[var(--action-primary)]"
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Accent Color
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CREATOR_COLOR_OPTIONS.map((option) => {
                      const accent = getCreatorAccentByKey(option.key);
                      if (!accent) {
                        return null;
                      }
                      return (
                        <label
                          key={option.key}
                          className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--panel-border)] bg-white/80 px-3 py-2 text-sm transition hover:border-slate-300"
                        >
                          <input
                            type="radio"
                            name="color"
                            value={option.key}
                            defaultChecked={selectedColor === option.key}
                            className="h-4 w-4 accent-[var(--action-primary)]"
                          />
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: accent.accent }}
                          />
                          <span className="text-[var(--text-primary)]">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="flex justify-end">
                  <button type="submit" className="pill-button button-hover text-xs font-semibold">
                    Save Profile Style
                  </button>
                </div>
              </form>
            </SettingsDisclosure>
          </div>

          <div className="surface overflow-hidden">
            <SettingsDisclosure
              icon={<CalendarClock className="h-4 w-4" />}
              label="Calendar preferences"
              previewValue={calendarPrefPreview}
              description="Choose defaults for how your shared calendar is displayed."
            >
              <form action={handleCalendarWeekStart}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Week Starts On
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/80 px-4 py-2 text-sm transition hover:bg-white">
                    <input
                      className="h-4 w-4 accent-[var(--action-primary)]"
                      type="radio"
                      name="weekStart"
                      value="sunday"
                      defaultChecked={calendarWeekStart === "sunday"}
                    />
                    Sunday
                  </label>
                  <label className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/80 px-4 py-2 text-sm transition hover:bg-white">
                    <input
                      className="h-4 w-4 accent-[var(--action-primary)]"
                      type="radio"
                      name="weekStart"
                      value="monday"
                      defaultChecked={calendarWeekStart === "monday"}
                    />
                    Monday
                  </label>
                  <button
                    type="submit"
                    className="pill-button button-hover text-xs font-semibold"
                  >
                    Save
                  </button>
                </div>
              </form>

              <form action={handleCalendarTimeFormat} className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Time Format
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/80 px-4 py-2 text-sm transition hover:bg-white">
                    <input
                      className="h-4 w-4 accent-[var(--action-primary)]"
                      type="radio"
                      name="timeFormat"
                      value="24h"
                      defaultChecked={calendarTimeFormat === "24h"}
                    />
                    24-hour (19:00)
                  </label>
                  <label className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/80 px-4 py-2 text-sm transition hover:bg-white">
                    <input
                      className="h-4 w-4 accent-[var(--action-primary)]"
                      type="radio"
                      name="timeFormat"
                      value="12h"
                      defaultChecked={calendarTimeFormat === "12h"}
                    />
                    12-hour (7 PM)
                  </label>
                  <button
                    type="submit"
                    className="pill-button button-hover text-xs font-semibold"
                  >
                    Save
                  </button>
                </div>
              </form>
            </SettingsDisclosure>
          </div>

        </div>
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <GoogleCalendarSettings />
        <MembershipActions
          isCreator={isCreator}
          canLeave={canLeave}
          hasPartner={Boolean(partner)}
          partnerLabel={partnerVisual?.displayName ?? partner?.user.name ?? "your partner"}
          onRemovePartner={handleRemovePartner}
          onLeaveSpace={handleLeaveSpace}
        />
      </div>
      <OnboardingSettings spaceId={space.id} />
    </div>
  );
}

