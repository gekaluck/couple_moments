import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createEventComment, createEventPhoto, deleteEvent, getEventForUser, listEventComments, updateEvent, updateEventRating } from "@/lib/events";
import { requireUserId } from "@/lib/current-user";
import { buildCreatorPalette, getCreatorInitials } from "@/lib/creator-colors";
import { prisma } from "@/lib/prisma";
import { normalizeTags, parseTags } from "@/lib/tags";

import EventComments from "./event-comments";
import EventEditModal from "./event-edit-modal";
import EventRating from "./event-rating";
import IconButton from "@/components/ui/IconButton";
import TagBadge from "@/components/ui/TagBadge";
import ConfirmForm from "@/components/ConfirmForm";
import PhotoUploader from "@/components/photos/PhotoUploader";

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
    const placeLat = formData.get("placeLat")
      ? Number(formData.get("placeLat"))
      : null;
    const placeLng = formData.get("placeLng")
      ? Number(formData.get("placeLng"))
      : null;
    const placeUrl = formData.get("placeUrl")?.toString() || null;

    if (!title || !date) {
      redirect(`/events/${eventIdForActions}`);
    }

    const dateTimeStart = new Date(`${date}T${time}`);
    if (Number.isNaN(dateTimeStart.getTime())) {
      redirect(`/events/${eventIdForActions}`);
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

    redirect(`/events/${eventIdForActions}`);
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
  const members = await prisma.membership.findMany({
    where: { coupleSpaceId: event.coupleSpaceId },
    select: {
      userId: true,
      user: { select: { name: true, email: true } },
    },
  });
  const creatorPalette = buildCreatorPalette(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name ?? null,
      email: member.user.email,
    })),
  );
  const creatorColors = creatorPalette.get(event.createdByUserId);
  const creatorGradient =
    creatorColors?.accent === "var(--accent-secondary)"
      ? "linear-gradient(135deg,#60a5fa,#6366f1)"
      : "linear-gradient(135deg,#fb7185,#db2777)";
  const creatorInitials = creator
    ? getCreatorInitials({
        id: event.createdByUserId,
        name: creator.name ?? null,
        email: creator.email,
      })
    : "??";
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
  const staticMapUrl =
    mapsKey && event.placeLat && event.placeLng
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${event.placeLat},${event.placeLng}&zoom=14&size=700x320&markers=color:0xdb2777%7C${event.placeLat},${event.placeLng}&key=${mapsKey}`
      : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--panel-border)] bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <div>
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              <Link
                className="transition hover:text-[var(--accent-strong)]"
                href={backHref}
              >
                {isFromMemories ? "Memories" : "Calendar"}
              </Link>
              <span>/</span>
              <span>Event</span>
            </nav>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Event details
            </h1>
          </div>
          <Link
            className="text-sm text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
            href={backHref}
          >
            {isFromMemories ? "Back to memories" : "Back to calendar"}
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <section className={`surface p-6 ${isPast ? "bg-gradient-to-br from-white via-white to-slate-50/70" : "bg-gradient-to-br from-white via-white to-rose-50/70"}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white ${isPast ? "bg-slate-500" : "bg-rose-500"}`}>
                    {isPast ? "Memory" : "Upcoming"}
                  </span>
                  <span>
                    {formatDateInput(event.dateTimeStart)}
                    {event.timeIsSet ? ` at ${formatTimeInput(event.dateTimeStart)}` : ""}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[var(--font-display)]">
                  {event.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)]">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/90 px-3 py-1 text-[var(--text-muted)]">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{
                        background: creatorGradient,
                      }}
                    >
                      {creatorInitials}
                    </span>
                    Created by {creator?.name || creator?.email || "Unknown"}
                  </span>
                  {tags.length > 0 ? (
                    <span className="flex flex-wrap items-center gap-3">
                      {tags.map((tag) => (
                        <TagBadge key={tag} label={tag} />
                      ))}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                {isPast ? (
                  <Link href={`/spaces/${event.coupleSpaceId}/calendar?repeat=${event.id}`}>
                    <IconButton
                      icon={<RepeatIcon />}
                      label="Do this again"
                      variant="primary"
                    />
                  </Link>
                ) : null}
                <Link href={`/events/${event.id}?edit=1`}>
                  <IconButton
                    icon={<PencilIcon />}
                    label="Edit event"
                    variant="secondary"
                  />
                </Link>
                <ConfirmForm action={handleDelete} message="Delete this event?">
                  <IconButton
                    icon={<TrashIcon />}
                    label="Delete event"
                    variant="danger"
                    type="submit"
                  />
                </ConfirmForm>
              </div>
            </div>
            {event.description ? (
              <p className="mt-5 text-sm text-[var(--text-muted)]">
                {event.description}
              </p>
            ) : null}
            {isPast ? (
              <EventRating
                eventId={event.id}
                currentRating={event.rating}
                onRate={handleRate}
              />
            ) : null}
            {hasPlace ? (
              <div className="mt-5 rounded-2xl border border-[var(--panel-border)] bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      Place
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {event.placeName || "Selected place"}
                    </p>
                    {event.placeAddress ? (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {event.placeAddress}
                      </p>
                    ) : null}
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
                  </div>
                  {placeLink ? (
                    <a
                      className="text-sm font-semibold text-rose-600 transition hover:text-rose-700 hover:underline"
                      href={placeLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Maps
                    </a>
                  ) : null}
                </div>
                {staticMapUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={event.placeName || "Event location"}
                    className="mt-4 h-[200px] w-full rounded-xl object-cover"
                    src={staticMapUrl}
                  />
                ) : null}
                {placeOpeningHours && placeOpeningHours.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-[var(--panel-border)] bg-white/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      Opening hours
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
                      {placeOpeningHours.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="mt-5 rounded-2xl border border-[var(--panel-border)] bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    Memory photos
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Photos appear on the Memories thumbnail.
                  </p>
                </div>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-rose-600 transition hover:text-rose-700">
                  Add a photo
                </summary>
                <form id="photo-upload-form" className="mt-3" action={handleAddPhoto}>
                  <input id="photo-url-input" type="hidden" name="photoUrl" />
                  <PhotoUploader
                    cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    formId="photo-upload-form"
                    inputId="photo-url-input"
                  />
                </form>
              </details>
              {photos.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={photo.id}
                      alt={event.title}
                      className="h-[160px] w-full rounded-xl object-cover"
                      src={photo.storageUrl}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        <EventComments
          eventId={event.id}
          initialComments={comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            author: {
              name: comment.author.name,
              email: comment.author.email,
            },
          }))}
          currentUser={{
            name: currentUser.name,
            email: currentUser.email,
          }}
          onSubmit={handleComment}
        />
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
      </main>
    </div>
  );
}
