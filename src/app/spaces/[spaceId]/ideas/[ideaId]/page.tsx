import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCoupleSpaceForUser, listSpaceMembers } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { createEventForSpace } from "@/lib/events";
import {
  createIdeaComment,
  deleteIdea,
  getIdeaForUser,
  listIdeaComments,
  updateIdea,
} from "@/lib/ideas";
import { deleteNote } from "@/lib/notes";
import { normalizeTags, parseTags } from "@/lib/tags";
import {
  createGoogleCalendarEvent,
  hasGoogleCalendarWithEventsScope,
} from "@/lib/integrations/google/events";
import { parseLocalDateTime, parseOffsetMinutes } from "@/lib/date-time";
import { parsePlaceFields } from "@/lib/event-form";
import {
  CREATOR_ACCENTS,
  buildCreatorVisuals,
  getAvatarGradient,
} from "@/lib/creator-colors";
import { resolveCalendarTimeFormat } from "@/lib/calendar";
import { sanitizeHttpUrl } from "@/lib/parsers";
import { getInitials } from "@/lib/formatters";
import LocalTime from "@/components/time/LocalTime";
import PlacePhotoStrip from "@/components/events/PlacePhotoStrip";
import TagBadge from "@/components/ui/TagBadge";

import IdeaActions, { IdeaDto } from "./idea-actions";
import IdeaComments from "./idea-comments";

type PageProps = {
  params: Promise<{ spaceId: string; ideaId: string }>;
};

export default async function IdeaDetailPage({ params }: PageProps) {
  const userId = await requireUserId();
  const { spaceId, ideaId } = await params;
  const cookieStore = await cookies();
  const timeFormat = resolveCalendarTimeFormat(
    cookieStore.get("cm_calendar_time_format")?.value,
  );

  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    redirect("/spaces/onboarding");
  }
  const spaceIdForActions = space.id;
  const calendarHref = `/spaces/${space.id}/calendar`;
  const ideaPath = `/spaces/${space.id}/ideas/${ideaId}`;

  const idea = await getIdeaForUser(ideaId, userId);
  if (!idea || idea.coupleSpaceId !== space.id) {
    redirect(calendarHref);
  }
  if (idea.convertedToEventId) {
    redirect(`/events/${idea.convertedToEventId}`);
  }

  const [comments, members, hasGoogleCalendar] = await Promise.all([
    listIdeaComments(ideaId),
    listSpaceMembers(space.id),
    hasGoogleCalendarWithEventsScope(userId),
  ]);
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
  const currentMember = members.find((member) => member.userId === userId);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const tags = parseTags(idea.tags);
  const placeOpeningHours = Array.isArray(idea.placeOpeningHours)
    ? idea.placeOpeningHours.map((item) => `${item}`)
    : null;
  const placePhotoUrls = Array.isArray(idea.placePhotoUrls)
    ? idea.placePhotoUrls.map((item) => `${item}`)
    : null;
  const placeLink =
    sanitizeHttpUrl(idea.placeUrl) ?? null;
  const placeWebsite = sanitizeHttpUrl(idea.placeWebsite) ?? null;
  const hasPlace = Boolean(idea.placeName || idea.placeAddress);

  const creatorVisual = memberVisuals[idea.createdByUserId];
  const creatorName =
    creatorVisual?.displayName || idea.createdBy.name || idea.createdBy.email;
  const creatorInitials =
    creatorVisual?.initials ||
    getInitials(idea.createdBy.name, idea.createdBy.email);

  const ideaDto: IdeaDto = {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    tags,
    placeId: idea.placeId,
    placeName: idea.placeName,
    placeAddress: idea.placeAddress,
    placeLat: idea.placeLat,
    placeLng: idea.placeLng,
    placeUrl: idea.placeUrl,
    placeWebsite: idea.placeWebsite ?? null,
    placeOpeningHours,
    placePhotoUrls,
  };

  async function handleSchedule(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const targetIdeaId = formData.get("ideaId")?.toString();
    const date = formData.get("date")?.toString();
    const rawTime = formData.get("time")?.toString() || "";
    const timeIsSet = rawTime.length > 0;
    const time = timeIsSet ? rawTime : "12:00";
    const addToGoogleCalendar = formData.get("addToGoogleCalendar") === "true";

    if (!targetIdeaId || !date) {
      throw new Error("Missing date.");
    }

    const targetIdea = await getIdeaForUser(targetIdeaId, currentUserId);
    if (!targetIdea) {
      throw new Error("Idea not found.");
    }

    const offsetMinutes = parseOffsetMinutes(formData.get("timeZoneOffsetStart"));
    const dateTimeStart =
      parseLocalDateTime({ date, time, offsetMinutes }) ??
      new Date(`${date}T${time}`);
    if (Number.isNaN(dateTimeStart.getTime())) {
      throw new Error("Invalid date.");
    }

    const event = await createEventForSpace(spaceIdForActions, currentUserId, {
      title: targetIdea.title,
      description: targetIdea.description,
      dateTimeStart,
      dateTimeEnd: null,
      timeIsSet,
      tags: normalizeTags(parseTags(targetIdea.tags)),
      linkedIdeaId: targetIdea.id,
      placeId: targetIdea.placeId,
      placeName: targetIdea.placeName,
      placeAddress: targetIdea.placeAddress,
      placeWebsite: targetIdea.placeWebsite ?? null,
      placeOpeningHours: Array.isArray(targetIdea.placeOpeningHours)
        ? targetIdea.placeOpeningHours.map((item) => `${item}`)
        : null,
      placePhotoUrls: Array.isArray(targetIdea.placePhotoUrls)
        ? targetIdea.placePhotoUrls.map((item) => `${item}`)
        : null,
      placeLat: targetIdea.placeLat,
      placeLng: targetIdea.placeLng,
      placeUrl: targetIdea.placeUrl,
    });

    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);

    if (addToGoogleCalendar) {
      const syncResult = await createGoogleCalendarEvent(currentUserId, {
        id: event.id,
        title: event.title,
        description: event.description,
        dateTimeStart: event.dateTimeStart,
        dateTimeEnd: event.dateTimeEnd,
        timeIsSet: event.timeIsSet,
        placeName: event.placeName,
        placeAddress: event.placeAddress,
      });
      return {
        eventId: event.id,
        googleSync: {
          attempted: true,
          success: syncResult.success,
          message: syncResult.success
            ? undefined
            : syncResult.error ??
              "Event created in Duet, but Google Calendar sync failed.",
        },
      };
    }

    return {
      eventId: event.id,
      googleSync: {
        attempted: false,
        success: true,
      },
    };
  }

  async function handleEdit(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const targetIdeaId = formData.get("ideaId")?.toString();
    const title = formData.get("title")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";
    const formTags = normalizeTags(formData.get("tags"));
    const place = parsePlaceFields(formData);

    if (!targetIdeaId || !title) {
      return;
    }

    await updateIdea(targetIdeaId, currentUserId, {
      title,
      description: description || null,
      tags: formTags,
      ...place,
    });

    revalidatePath(ideaPath);
    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const targetIdeaId = formData.get("ideaId")?.toString();
    if (!targetIdeaId) {
      return;
    }
    await deleteIdea(targetIdeaId, currentUserId);
    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleAddComment(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const targetIdeaId = formData.get("ideaId")?.toString();
    const content = formData.get("content")?.toString().trim() ?? "";
    if (!targetIdeaId || !content) {
      return;
    }
    await createIdeaComment(targetIdeaId, currentUserId, content);
    revalidatePath(ideaPath);
  }

  async function handleDeleteComment(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const commentId = formData.get("commentId")?.toString();
    if (!commentId) {
      return;
    }
    await deleteNote(commentId, currentUserId);
    revalidatePath(ideaPath);
  }

  return (
    <div className="min-h-screen page-enter">
      <header className="border-b border-amber-200/50 bg-[linear-gradient(175deg,rgba(255,255,255,0.92),rgba(254,243,220,0.7))] backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-5 md:px-6 md:py-7">
          <div className="flex items-center gap-2">
            <Link
              href={calendarHref}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] transition hover:text-amber-600"
            >
              Calendar
            </Link>
            <span className="text-[var(--text-tertiary)]">/</span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
              Idea
            </span>
          </div>
          <h1 className="mt-2 max-w-4xl text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)] md:text-3xl break-words">
            {idea.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Added{" "}
            <LocalTime
              options={{ month: "long", day: "numeric", year: "numeric" }}
              value={idea.createdAt}
            />{" "}
            · by {creatorName}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <IdeaActions
              idea={ideaDto}
              calendarHref={calendarHref}
              mapsApiKey={mapsApiKey}
              hasGoogleCalendar={hasGoogleCalendar}
              onSchedule={handleSchedule}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            <Link
              className="ml-auto hidden rounded-full border border-[var(--panel-border)] bg-white/90 px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition hover:border-amber-300 hover:text-amber-700 md:inline-flex"
              href={calendarHref}
            >
              Back to calendar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="event-details-card rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
            Details
          </h3>

          <div className="mt-4 flex flex-col gap-1.5">
            <div className="event-details-row">
              <span className="event-details-label">Status</span>
              <span className="event-details-value inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                On the shortlist
              </span>
            </div>

            <div className="event-details-row">
              <span className="event-details-label">Added</span>
              <span className="event-details-value">
                <LocalTime
                  options={{
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }}
                  value={idea.createdAt}
                />
              </span>
            </div>

            <div className="event-details-row">
              <span className="event-details-label">Created by</span>
              <span className="event-details-value inline-flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{
                    backgroundImage: creatorVisual
                      ? getAvatarGradient(creatorVisual.accent)
                      : getAvatarGradient(CREATOR_ACCENTS.amber),
                  }}
                >
                  {creatorInitials}
                </span>
                {creatorName}
              </span>
            </div>

            {tags.length > 0 ? (
              <div className="event-details-row">
                <span className="event-details-label">Tags</span>
                <span className="event-details-value flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <TagBadge key={tag} label={tag} />
                  ))}
                </span>
              </div>
            ) : null}
          </div>

          {idea.description ? (
            <div className="mt-4 rounded-xl border border-amber-100/80 bg-white/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                Description
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
                {idea.description}
              </p>
            </div>
          ) : null}
        </section>

        {hasPlace ? (
          <section className="rounded-2xl border border-amber-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(254,243,220,0.6))] p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
                Location
              </h3>
            </div>

            <div className="mt-4 rounded-xl border border-amber-100/80 bg-white/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {idea.placeName || "Selected place"}
                  </p>
                  {idea.placeAddress ? (
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {idea.placeAddress}
                    </p>
                  ) : null}
                </div>
                {placeLink ? (
                  <a
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
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
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700 hover:underline"
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
                <details className="mt-4 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-amber-700">
                    View hours
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                    {placeOpeningHours.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </details>
              ) : null}

              {(placePhotoUrls && placePhotoUrls.length > 0) || idea.placeId ? (
                <PlacePhotoStrip
                  className="mt-4"
                  photoUrls={placePhotoUrls ?? []}
                  placeId={idea.placeId}
                  alt={idea.placeName || idea.title}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        <IdeaComments
          ideaId={idea.id}
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
            name: currentMember?.user.name ?? null,
            email: currentMember?.user.email ?? "",
          }}
          memberVisuals={memberVisuals}
          timeFormat={timeFormat}
          onSubmit={handleAddComment}
          onDelete={handleDeleteComment}
        />
      </main>
    </div>
  );
}
