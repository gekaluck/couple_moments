import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createEventComment, deleteEvent, updateEvent, updateEventRating } from "@/lib/events";
import {
  cancelGoogleCalendarEvent,
  getGoogleEventDeleteContext,
  updateGoogleCalendarEvent,
} from "@/lib/integrations/google/events";
import { deleteNote } from "@/lib/notes";
import { requireUserId } from "@/lib/current-user";
import { normalizeTags, parseTags } from "@/lib/tags";
import { parseJsonStringArray } from "@/lib/parsers";
import { CREATOR_ACCENTS, getAvatarGradient } from "@/lib/creator-colors";
import { getInitials } from "@/lib/formatters";
import { formatEventTime, resolveCalendarTimeFormat } from "@/lib/calendar";

import { loadEventBaseData, loadEventDetailData } from "./page-data";
import EventComments from "./event-comments";
import EventEditModal from "./event-edit-modal";
import EventRating from "./event-rating";
import HeartRating from "@/components/ui/HeartRating";
import ConfirmForm from "@/components/ConfirmForm";
import PlacePhotoStrip from "@/components/events/PlacePhotoStrip";

const PencilIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 5l5 5" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M3 6h18" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M8 6V4h8v2M6 6l1 14h10l1-14"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v6M14 11v6" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RepeatIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M17 1l4 4-4 4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 11V9a4 4 0 0 1 4-4h14"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 23l-4-4 4-4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 13v2a4 4 0 0 1-4 4H3"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ edit?: string; from?: string; spaceId?: string }>;
};

type EventActionResult = {
  googleSync?: {
    attempted: boolean;
    success: boolean;
    message?: string;
    info?: string;
  };
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function isEventInPast(event: { dateTimeStart: Date; dateTimeEnd: Date | null }) {
  const end = event.dateTimeEnd ?? event.dateTimeStart;
  return end < new Date();
}

export default async function EventPage({ params, searchParams }: PageProps) {
  const cookieStore = await cookies();
  const calendarTimeFormat = resolveCalendarTimeFormat(
    cookieStore.get("cm_calendar_time_format")?.value,
  );
  const userId = await requireUserId();
  const { eventId } = await params;
  const search = (await searchParams) ?? {};
  const isEditing = search.edit === "1";
  const [event, currentUser] = await loadEventBaseData(eventId, userId);

  if (!event) {
    notFound();
  }
  if (!currentUser) {
    redirect("/login");
  }
  const {
    currentUserRating,
    allRatings,
    comments,
    creator,
    googleSyncStatus,
    members,
    memberVisuals,
  } =
    await loadEventDetailData({
      eventId,
      userId,
      coupleSpaceId: event.coupleSpaceId,
      createdByUserId: event.createdByUserId,
    });
  // Store event ID for use in server actions (avoids TypeScript narrowing issues)
  const eventIdForActions = event.id;
  const spaceIdForActions = event.coupleSpaceId;
  const isFromMemories = search.from === "memories" && search.spaceId;
  const backHref = isFromMemories
    ? `/spaces/${search.spaceId}/memories`
    : `/spaces/${event.coupleSpaceId}/calendar`;

  async function handleUpdate(formData: FormData): Promise<EventActionResult | void> {
    "use server";
    const currentUserId = await requireUserId();
    const title = formData.get("title")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";
    const date = formData.get("date")?.toString();
    const rawTime = formData.get("time")?.toString() || "";
    const timeIsSet = rawTime.length > 0;
    const time = timeIsSet ? rawTime : "12:00";
    const tags = normalizeTags(formData.get("tags"));
    const placeId = formData.get("placeId")?.toString() || null;
    const placeName = formData.get("placeName")?.toString() || null;
    const placeAddress = formData.get("placeAddress")?.toString() || null;
    const placeWebsite = formData.get("placeWebsite")?.toString() || null;
    const placeOpeningHours = parseJsonStringArray(
      formData.get("placeOpeningHours")?.toString() ?? null,
    );
    const placePhotoUrls = parseJsonStringArray(
      formData.get("placePhotoUrls")?.toString() ?? null,
    );
    const placeLat = parseFloat(formData.get("placeLat")?.toString() ?? "");
    const placeLng = parseFloat(formData.get("placeLng")?.toString() ?? "");
    const placeUrl = formData.get("placeUrl")?.toString() || null;

    if (!title || !date) {
      return;
    }

    const dateTimeStart = new Date(`${date}T${time}`);
    if (Number.isNaN(dateTimeStart.getTime())) {
      return;
    }

    const event = await updateEvent(eventIdForActions, currentUserId, {
      title,
      description: description || null,
      dateTimeStart,
      timeIsSet,
      tags,
      placeId,
      placeName,
      placeAddress,
      placeWebsite,
      placeOpeningHours,
      placePhotoUrls,
      placeLat: Number.isNaN(placeLat) ? null : placeLat,
      placeLng: Number.isNaN(placeLng) ? null : placeLng,
      placeUrl,
    });
    const googleSyncResult = await updateGoogleCalendarEvent(event.id, {
      id: event.id,
      title: event.title,
      description: event.description,
      dateTimeStart: event.dateTimeStart,
      dateTimeEnd: event.dateTimeEnd,
      timeIsSet: event.timeIsSet,
      placeName: event.placeName,
      placeAddress: event.placeAddress,
    });

    revalidatePath(`/events/${eventIdForActions}`);
    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
    if (googleSyncResult.code === "NOT_SYNCED") {
      return {
        googleSync: {
          attempted: false,
          success: true,
        },
      };
    }
    return {
      googleSync: {
        attempted: true,
        success: googleSyncResult.success,
        message: googleSyncResult.success
          ? undefined
          : googleSyncResult.error ??
            "Updated in Duet, but failed to sync changes to Google Calendar.",
        info: googleSyncResult.recovered
          ? "Google event link was stale. The invite was recreated."
          : undefined,
      },
    };
  }

  async function runDeleteWithGoogleSync(): Promise<EventActionResult> {
    "use server";
    const googleDeleteContext = await getGoogleEventDeleteContext(eventIdForActions);
    const currentUserId = await requireUserId();
    await deleteEvent(eventIdForActions, currentUserId);
    const googleDeleteResult = await cancelGoogleCalendarEvent(googleDeleteContext);

    if (googleDeleteResult.code === "NOT_SYNCED") {
      return {
        googleSync: {
          attempted: false,
          success: true,
        },
      };
    }
    return {
      googleSync: {
        attempted: true,
        success: googleDeleteResult.success,
        message: googleDeleteResult.success
          ? undefined
          : googleDeleteResult.error ??
            "Deleted in Duet, but failed to cancel Google Calendar event.",
        info: googleDeleteResult.recovered
          ? "Linked Google event was already missing. Local sync link was cleaned up."
          : undefined,
      },
    };
  }

  async function handleDeleteFromModal(): Promise<EventActionResult> {
    "use server";
    return runDeleteWithGoogleSync();
  }

  async function handleDeleteFromHeader(): Promise<void> {
    "use server";
    await runDeleteWithGoogleSync();
    redirect(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleComment(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const content = formData.get("content")?.toString().trim() ?? "";
    if (!content) {
      return;
    }
    await createEventComment(eventIdForActions, currentUserId, content);
    revalidatePath(`/events/${eventIdForActions}`);
  }

  async function handleDeleteComment(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const commentId = formData.get("commentId")?.toString();
    if (!commentId) {
      return;
    }
    await deleteNote(commentId, currentUserId);
    revalidatePath(`/events/${eventIdForActions}`);
  }

  async function handleRate(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const rating = Number(formData.get("rating"));
    if (!rating || rating < 1 || rating > 5) {
      return;
    }
    await updateEventRating(eventIdForActions, currentUserId, rating);
    revalidatePath(`/events/${eventIdForActions}`);
  }

  const tags = parseTags(event.tags);
  const tagsValue = tags.join(", ");
  const isPast = isEventInPast(event);
  const creatorVisual = memberVisuals[event.createdByUserId];
  const creatorName = creatorVisual?.displayName || creator?.name || creator?.email || "Unknown";
  const creatorInitials =
    creatorVisual?.initials || getInitials(creator?.name ?? null, creator?.email ?? creatorName);
  const ratingsByUserId = new Map(allRatings.map((rating) => [rating.userId, rating.value]));
  const partnerMembers = members.filter((member) => member.userId !== userId);
  const eventDateLabel = event.dateTimeStart.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const startTimeLabel = formatEventTime(event.dateTimeStart, calendarTimeFormat);
  const endTimeLabel = event.dateTimeEnd
    ? formatEventTime(event.dateTimeEnd, calendarTimeFormat)
    : null;
  const eventTimeLabel = event.timeIsSet
    ? endTimeLabel && endTimeLabel !== startTimeLabel
      ? `${startTimeLabel} - ${endTimeLabel}`
      : startTimeLabel
    : "Anytime";
  const statusLabel = isPast ? "Past" : "Upcoming";
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasPlace = Boolean(event.placeName || event.placeAddress);
  const placeLink =
    event.placeUrl ||
    (event.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${event.placeId}`
      : null);
  const placeWebsite = event.placeWebsite ?? null;
  const placeOpeningHours = Array.isArray(event.placeOpeningHours)
    ? (event.placeOpeningHours as string[])
    : null;
  const placePhotoUrls = Array.isArray(event.placePhotoUrls)
    ? (event.placePhotoUrls as string[])
    : null;
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayHours =
    placeOpeningHours?.find((line) =>
      line.toLowerCase().startsWith(todayName.toLowerCase()),
    ) ?? null;
  const staticMapUrl =
    mapsKey && event.placeLat && event.placeLng
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${event.placeLat},${event.placeLng}&zoom=14&size=700x320&markers=color:0xdb2777%7C${event.placeLat},${event.placeLng}&key=${mapsKey}`
      : null;

  return (
    <div className="min-h-screen page-enter">
      <header className="border-b border-rose-200/50 bg-[linear-gradient(175deg,rgba(255,255,255,0.92),rgba(255,236,244,0.75))] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-start justify-between gap-4 px-6 py-7">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2">
              <Link
                href={backHref}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] transition hover:text-rose-600"
              >
                {isFromMemories ? "Memories" : "Calendar"}
              </Link>
              <span className="text-[var(--text-tertiary)]">/</span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                Event
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)]">
              {event.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {eventDateLabel} · {eventTimeLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isPast ? (
              <Link
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white/90 text-rose-600 shadow-[var(--shadow-sm)] transition hover:border-rose-300 hover:bg-rose-50"
                href={`/spaces/${event.coupleSpaceId}/calendar?repeat=${event.id}`}
                title="Do this again"
                aria-label="Do this again"
              >
                <RepeatIcon />
              </Link>
            ) : null}
            <Link
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white/90 text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white"
              href={`/events/${event.id}?edit=1`}
              title="Edit event"
              aria-label="Edit event"
            >
              <PencilIcon />
            </Link>
            <ConfirmForm action={handleDeleteFromHeader} message="Delete this event?">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white/90 text-red-600 shadow-[var(--shadow-sm)] transition hover:border-red-300 hover:bg-red-50"
                type="submit"
                title="Delete event"
                aria-label="Delete event"
              >
                <TrashIcon />
              </button>
            </ConfirmForm>
            <Link
              className="rounded-full border border-[var(--panel-border)] bg-white/90 px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition hover:border-rose-300 hover:text-rose-600"
              href={backHref}
            >
              {isFromMemories ? "Back to memories" : "Back to calendar"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-6 py-8">
        <section className="rounded-2xl border border-rose-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(255,240,246,0.72))] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Event Details
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isPast
                  ? "border border-slate-200 bg-slate-100 text-slate-600"
                  : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isPast ? "bg-slate-400" : "bg-rose-500"}`} />
              {statusLabel}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Date & Time Card */}
            <div className="rounded-xl border border-rose-100/80 bg-white/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{eventDateLabel}</p>
                  <p className="text-xs text-[var(--text-muted)]">{eventTimeLabel}</p>
                </div>
              </div>
            </div>

            {/* Created By Card */}
            <div className="rounded-xl border border-rose-100/80 bg-white/70 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{
                    backgroundImage: creatorVisual
                      ? getAvatarGradient(creatorVisual.accent)
                      : getAvatarGradient(CREATOR_ACCENTS.rose),
                  }}
                >
                  {creatorInitials}
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Created by</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{creatorName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full border border-rose-200/70 bg-white/85 px-3 py-1 text-xs font-medium text-rose-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Rating (for past events) */}
          {isPast ? (
            <div className="mt-4 rounded-xl border border-rose-100/80 bg-white/70 p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Ratings</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">How was this date?</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-rose-100/80 bg-white/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Your rating</p>
                    <EventRating
                      eventId={event.id}
                      currentRating={currentUserRating?.value ?? null}
                      onRate={handleRate}
                      compact
                    />
                  </div>

                  {partnerMembers.map((partnerMember) => {
                    const partnerVisual = memberVisuals[partnerMember.userId];
                    const partnerName =
                      partnerVisual?.displayName ||
                      partnerMember.user.name ||
                      partnerMember.user.email;
                    const partnerRating = ratingsByUserId.get(partnerMember.userId) ?? null;

                    return (
                      <div
                        key={partnerMember.userId}
                        className="flex items-center justify-between gap-3 border-t border-rose-100/80 pt-2"
                      >
                        <p className="text-xs font-medium text-[var(--text-muted)]">
                          {partnerName}
                        </p>
                        {partnerRating ? (
                          <HeartRating value={partnerRating} readonly size="sm" />
                        ) : (
                          <span className="text-xs text-[var(--text-tertiary)]">
                            Not rated yet
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Google Sync Status */}
          {googleSyncStatus?.synced ? (
            <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Synced with Google Calendar
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-rose-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(255,240,246,0.72))] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Notes
            </h3>
          </div>
          {event.description ? (
            <div className="mt-4 rounded-xl border border-rose-100/80 bg-white/70 p-4">
              <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                {event.description}
              </p>
            </div>
          ) : (
            <Link
              className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-rose-200/80 bg-white/50 px-4 py-4 text-sm text-[var(--text-muted)] transition hover:border-rose-300 hover:bg-white/70"
              href={`/events/${event.id}?edit=1`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
              Add a note about this event...
            </Link>
          )}
        </section>

        {hasPlace ? (
          <section className="rounded-2xl border border-rose-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(255,240,246,0.72))] p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
                Location
              </h3>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.15fr]">
              <div className="rounded-xl border border-rose-100/80 bg-white/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[var(--text-primary)]">
                      {event.placeName || "Selected place"}
                    </p>
                    {event.placeAddress ? (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {event.placeAddress}
                      </p>
                    ) : null}
                  </div>
                  {placeLink ? (
                    <a
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      href={placeLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Maps
                    </a>
                  ) : null}
                </div>
                {placeWebsite ? (
                  <a
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 transition hover:text-rose-700 hover:underline"
                    href={placeWebsite}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
                    </svg>
                    Visit website
                  </a>
                ) : null}

                {placeOpeningHours && placeOpeningHours.length > 0 ? (
                  <details className="mt-4 rounded-lg border border-rose-100 bg-rose-50/50 p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-rose-700">
                      {todayHours ? `Today: ${todayHours.split(": ")[1] || todayHours}` : "View hours"}
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                      {placeOpeningHours.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>

              <div className="space-y-3">
                {staticMapUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={event.placeName || "Event location"}
                    className="h-[200px] w-full rounded-xl border border-rose-100/80 object-cover shadow-sm"
                    src={staticMapUrl}
                  />
                ) : null}

                {placePhotoUrls && placePhotoUrls.length > 0 ? (
                  <PlacePhotoStrip
                    photoUrls={placePhotoUrls.slice(0, 3)}
                    alt={event.placeName || "Place photo"}
                  />
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <EventComments
          eventId={event.id}
          initialComments={comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            author: {
              id: comment.author.id,
              name: comment.author.name,
              email: comment.author.email,
            },
          }))}
          currentUserId={userId}
          currentUser={{
            name: currentUser.name,
            email: currentUser.email,
          }}
          memberVisuals={memberVisuals}
          timeFormat={calendarTimeFormat}
          onSubmit={handleComment}
          onDelete={handleDeleteComment}
        />
      </main>
      <EventEditModal
        isOpen={isEditing}
        onCloseHref={`/events/${event.id}`}
        onSubmit={handleUpdate}
        onDelete={handleDeleteFromModal}
        mapsApiKey={mapsKey}
        title={event.title}
        dateValue={formatDateInput(event.dateTimeStart)}
        timeValue={event.timeIsSet ? formatTimeInput(event.dateTimeStart) : ""}
        tagsValue={tagsValue}
        descriptionValue={event.description ?? ""}
        placeId={event.placeId}
        placeName={event.placeName}
        placeAddress={event.placeAddress}
        placeLat={event.placeLat}
        placeLng={event.placeLng}
        placeUrl={event.placeUrl}
        placeWebsite={event.placeWebsite}
        placeOpeningHours={
          Array.isArray(event.placeOpeningHours)
            ? (event.placeOpeningHours as string[])
            : null
        }
        placePhotoUrls={
          Array.isArray(event.placePhotoUrls)
            ? (event.placePhotoUrls as string[])
            : null
        }
      />
    </div>
  );
}


