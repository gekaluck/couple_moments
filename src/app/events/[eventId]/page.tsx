import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createEventComment, createEventPhoto, deleteEvent, getEventForUser, listEventComments, updateEvent, updateEventRating } from "@/lib/events";
import { deleteNote } from "@/lib/notes";
import { requireUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { normalizeTags, parseTags } from "@/lib/tags";
import { getEventSyncStatus } from "@/lib/integrations/google/events";

import EventComments from "./event-comments";
import EventEditModal from "./event-edit-modal";
import EventRating from "./event-rating";
import ConfirmForm from "@/components/ConfirmForm";
import PhotoUploader from "@/components/photos/PhotoUploader";
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

function parseJsonArray(value?: string | null) {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => `${item}`) : null;
  } catch {
    return null;
  }
}

export default async function EventPage({ params, searchParams }: PageProps) {
  const userId = await requireUserId();
  const { eventId } = await params;
  const search = (await searchParams) ?? {};
  const isEditing = search.edit === "1";
  const event = await getEventForUser(eventId, userId);
  const currentUserRating = event
    ? await prisma.rating.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        select: { value: true },
      })
    : null;
  const photos = await prisma.photo.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
  });
  const comments = await listEventComments(eventId);
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const creator = event
    ? await prisma.user.findUnique({
        where: { id: event.createdByUserId },
        select: { name: true, email: true },
      })
    : null;
  const googleSyncStatus = event ? await getEventSyncStatus(event.id) : null;

  if (!event) {
    notFound();
  }
  if (!currentUser) {
    redirect("/login");
  }
  // Store event ID for use in server actions (avoids TypeScript narrowing issues)
  const eventIdForActions = event.id;
  const spaceIdForActions = event.coupleSpaceId;
  const isFromMemories = search.from === "memories" && search.spaceId;
  const backHref = isFromMemories
    ? `/spaces/${search.spaceId}/memories`
    : `/spaces/${event.coupleSpaceId}/calendar`;

  async function handleUpdate(formData: FormData) {
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
    const placeOpeningHours = parseJsonArray(
      formData.get("placeOpeningHours")?.toString() ?? null,
    );
    const placePhotoUrls = parseJsonArray(
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

    await updateEvent(eventIdForActions, currentUserId, {
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

    revalidatePath(`/events/${eventIdForActions}`);
    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleDelete() {
    "use server";
    const currentUserId = await requireUserId();
    await deleteEvent(eventIdForActions, currentUserId);
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

  async function handleAddPhoto(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const url = formData.get("photoUrl")?.toString().trim() ?? "";
    if (!url) {
      return;
    }
    await createEventPhoto(eventIdForActions, currentUserId, url);
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
  const statusLabel = isPast ? "Past" : "Upcoming";
  const creatorName = creator?.name || creator?.email || "Unknown";
  const eventDateLabel = event.dateTimeStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const eventTimeLabel = event.timeIsSet
    ? event.dateTimeStart.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Anytime";
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
  const todayDayLabel = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayHours = placeOpeningHours?.find((line) =>
    line.toLowerCase().startsWith(todayDayLabel.toLowerCase()),
  );
  const placePhotoUrls = Array.isArray(event.placePhotoUrls)
    ? (event.placePhotoUrls as string[])
    : null;
  const staticMapUrl =
    mapsKey && event.placeLat && event.placeLng
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${event.placeLat},${event.placeLng}&zoom=14&size=700x320&markers=color:0xdb2777%7C${event.placeLat},${event.placeLng}&key=${mapsKey}`
      : null;

  return (
    <div className="min-h-screen page-enter">
      <header className="border-b border-[var(--panel-border)] bg-[linear-gradient(175deg,rgba(255,255,255,0.9),rgba(255,240,246,0.68))] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-start justify-between gap-4 px-6 py-7">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              {isFromMemories ? "Memories" : "Calendar"} / Event
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              {event.title}
            </h1>
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
            <ConfirmForm action={handleDelete} message="Delete this event?">
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
        <section className="surface p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Event details
          </p>
          <div className="mt-3 grid gap-2">
            <div className="grid items-center gap-1 sm:grid-cols-[110px_1fr]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Status
              </p>
              <p className="text-sm text-[var(--text-primary)]">{statusLabel}</p>
            </div>
            <div className="grid items-center gap-1 sm:grid-cols-[110px_1fr]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Date
              </p>
              <p className="text-sm text-[var(--text-primary)]">{eventDateLabel}</p>
            </div>
            <div className="grid items-center gap-1 sm:grid-cols-[110px_1fr]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Time
              </p>
              <p className="text-sm text-[var(--text-primary)]">{eventTimeLabel}</p>
            </div>
            <div className="grid items-center gap-1 sm:grid-cols-[110px_1fr]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Created by
              </p>
              <p className="text-sm text-[var(--text-primary)]">{creatorName}</p>
            </div>
            <div className="grid items-center gap-1 sm:grid-cols-[110px_1fr]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-full border border-[var(--panel-border)] bg-white/80 px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">None</p>
                )}
              </div>
            </div>
            {isPast ? (
              <div className="grid items-center gap-1 sm:grid-cols-[110px_1fr]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                  Rating
                </p>
                <EventRating
                  eventId={event.id}
                  currentRating={currentUserRating?.value ?? null}
                  onRate={handleRate}
                  compact
                />
              </div>
            ) : null}
            {googleSyncStatus?.synced ? (
              <div className="grid items-center gap-1 sm:grid-cols-[110px_1fr]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                  Sync
                </p>
                <p className="text-sm text-emerald-700">Synced with Google Calendar</p>
              </div>
            ) : null}
          </div>
        </section>

        {event.description ? (
          <section className="surface p-5 md:p-6">
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {event.description}
            </p>
          </section>
        ) : (
          <section className="border-b border-dashed border-[var(--panel-border)] pb-4">
            <Link
              className="inline-flex items-center text-sm font-medium text-[var(--text-secondary)] underline decoration-dashed underline-offset-4 transition hover:text-[var(--action-primary)]"
              href={`/events/${event.id}?edit=1`}
            >
              Add a note about this event...
            </Link>
          </section>
        )}

        {hasPlace ? (
          <section className="surface p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_1.15fr]">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Place
                    </p>
                    <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
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
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      href={placeLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Maps
                    </a>
                  ) : null}
                </div>
                {placeWebsite ? (
                  <a
                    className="mt-2 inline-flex text-sm font-semibold text-rose-600 transition hover:text-rose-700 hover:underline"
                    href={placeWebsite}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {placeWebsite}
                  </a>
                ) : null}

                {placeOpeningHours && placeOpeningHours.length > 0 ? (
                  <details className="mt-4 rounded-xl border border-[var(--panel-border)] bg-white/70 p-3">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                      {todayHours ? `Hours today: ${todayHours}` : "Opening hours"}
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
                      {placeOpeningHours.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>

              <div>
                {staticMapUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={event.placeName || "Event location"}
                    className="h-[220px] w-full rounded-2xl object-cover"
                    src={staticMapUrl}
                  />
                ) : null}

                {placePhotoUrls && placePhotoUrls.length > 0 ? (
                  <PlacePhotoStrip
                    photoUrls={placePhotoUrls.slice(0, 3)}
                    alt={event.placeName || "Place photo"}
                    className="mt-3"
                  />
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="surface p-5 md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Photos
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--panel-border)] bg-white/70 p-4">
            <form id="photo-upload-form" action={handleAddPhoto}>
              <input id="photo-url-input" type="hidden" name="photoUrl" />
              <PhotoUploader
                cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                formId="photo-upload-form"
                inputId="photo-url-input"
              />
            </form>
          </div>
          {photos.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  alt={event.title}
                  className="h-[170px] w-full rounded-xl object-cover"
                  src={photo.storageUrl}
                />
              ))}
            </div>
          ) : null}
        </section>

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
          onSubmit={handleComment}
          onDelete={handleDeleteComment}
        />
      </main>
      <EventEditModal
        isOpen={isEditing}
        onCloseHref={`/events/${event.id}`}
        onSubmit={handleUpdate}
        onDelete={handleDelete}
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


