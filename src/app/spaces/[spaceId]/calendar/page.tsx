import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import {
  formatEventTime,
  dateKey,
  formatMonthTitle,
  getMonthGrid,
  resolveCalendarTimeFormat,
} from "@/lib/calendar";
import {
  createAvailabilityBlock,
  updateAvailabilityBlock,
} from "@/lib/availability";
import {
  createEventForSpace,
  deleteEvent,
} from "@/lib/events";
import {
  createIdeaComment,
  createIdeaForSpace,
  deleteIdea,
  updateIdea,
} from "@/lib/ideas";
import { normalizeTags, parseTags } from "@/lib/tags";
import {
  cancelGoogleCalendarEvent,
  createGoogleCalendarEvent,
  getGoogleEventDeleteContext,
} from "@/lib/integrations/google/events";
import { parseJsonStringArray } from "@/lib/parsers";
import CalendarAddControls from "./add-controls";
import {
  buildBlocksByDay,
  buildEventCommentCounts,
  buildEventsByDay,
  buildIdeaCommentAggregates,
  loadCalendarPageData,
} from "./page-data";
import PlanningSection from "@/components/planning/PlanningSection";
import IdeasColumn from "@/components/planning/IdeasColumn";
import UpcomingPlansColumn from "@/components/planning/UpcomingPlansColumn";
import AvailabilityBlockModal from "./availability-block-modal";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { CalendarEmptyState } from "@/components/calendar/CalendarEmptyState";
import DayCell from "./day-cell";

type PageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams?: Promise<{
    month?: string;
    new?: string;
    editBlock?: string;
    repeat?: string;
    action?: string;
    density?: string;
  }>;
};

type GoogleSyncFeedback = {
  attempted: boolean;
  success: boolean;
  message?: string;
  info?: string;
};

type CalendarActionResult = {
  googleSync?: GoogleSyncFeedback;
};

export default async function CalendarPage({ params, searchParams }: PageProps) {
  const cookieStore = await cookies();
  const calendarWeekStart =
    cookieStore.get("cm_calendar_week_start")?.value === "monday"
      ? "monday"
      : "sunday";
  const calendarTimeFormat = resolveCalendarTimeFormat(
    cookieStore.get("cm_calendar_time_format")?.value,
  );
  const weekStartsOn = calendarWeekStart === "monday" ? 1 : 0;
  const userId = await requireUserId();
  const { spaceId } = await params;
  const search = (await searchParams) ?? {};
  const selectedMonth = search.month
    ? new Date(`${search.month}-01T00:00:00`)
    : new Date();
  const now = Number.isNaN(selectedMonth.getTime()) ? new Date() : selectedMonth;
  const density = search.density === "compact" ? "compact" : "comfortable";
  const isCompact = density === "compact";
  const initialEventDate =
    search.new && /^\d{4}-\d{2}-\d{2}$/.test(search.new) ? search.new : null;
  const editBlockId = search.editBlock ?? null;
  const repeatEventId = search.repeat ?? null;
  const openAction = search.action ?? "";
  const autoOpenIdea = openAction === "idea";
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    redirect("/spaces/onboarding");
  }
  // Store space ID for use in server actions (avoids TypeScript narrowing issues)
  const spaceIdForActions = space.id;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const actualToday = new Date();
  const {
    events,
    blocks,
    ideas,
    upcomingEvents,
    ideaComments,
    eventComments,
    hasGoogleCalendar,
    creatorPalette,
    memberVisuals,
    prefillData,
  } = await loadCalendarPageData({
    spaceId: space.id,
    userId,
    monthStart,
    monthEnd,
    repeatEventId,
    actualToday,
  });

  const eventsByDay = buildEventsByDay(events);

  async function handleCreate(formData: FormData): Promise<CalendarActionResult | void> {
    "use server";
    const currentUserId = await requireUserId();
    const title = formData.get("title")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";
    const date = formData.get("date")?.toString();
    const rawTime = formData.get("time")?.toString() || "";
    const timeIsSet = rawTime.length > 0;
    const time = timeIsSet ? rawTime : "12:00";
    const tags = normalizeTags(formData.get("tags"));
    const addToGoogleCalendar = formData.get("addToGoogleCalendar") === "true";
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

    const event = await createEventForSpace(spaceIdForActions, currentUserId, {
      title,
      description: description || null,
      dateTimeStart,
      dateTimeEnd: null,
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

    // Sync to Google Calendar if requested
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
        googleSync: {
          attempted: true,
          success: syncResult.success,
          message: syncResult.success
            ? undefined
            : syncResult.error ??
              "Event saved in Duet, but Google Calendar sync failed.",
        },
      };
    }

    return {
      googleSync: {
        attempted: false,
        success: true,
      },
    };
  }

  async function handleCreateBlock(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const title = formData.get("title")?.toString().trim() ?? "";
    const start = formData.get("start")?.toString();
    const end = formData.get("end")?.toString();
    const note = formData.get("note")?.toString().trim() ?? "";

    if (!title || !start || !end) {
      return;
    }

    const startAt = new Date(`${start}T00:00:00`);
    const endAt = new Date(`${end}T23:59:59`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return;
    }

    await createAvailabilityBlock(spaceIdForActions, currentUserId, {
      title,
      note: note || null,
      startAt,
      endAt,
    });

    return;
  }

  async function handleUpdateBlock(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const blockId = formData.get("blockId")?.toString();
    const title = formData.get("title")?.toString().trim() ?? "";
    const start = formData.get("start")?.toString();
    const end = formData.get("end")?.toString();
    const note = formData.get("note")?.toString().trim() ?? "";

    if (!blockId || !title || !start || !end) {
      return;
    }

    const startAt = new Date(`${start}T00:00:00`);
    const endAt = new Date(`${end}T23:59:59`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return;
    }

    await updateAvailabilityBlock(blockId, currentUserId, {
      title,
      note: note || null,
      startAt,
      endAt,
    });

    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleCreateIdea(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const title = formData.get("title")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";
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

    if (!title) {
      redirect(`/spaces/${spaceIdForActions}/calendar`);
    }

    await createIdeaForSpace(spaceIdForActions, currentUserId, {
      title,
      description: description || null,
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

  }

  async function handleScheduleIdea(formData: FormData): Promise<CalendarActionResult | void> {
    "use server";
    const currentUserId = await requireUserId();
    const ideaId = formData.get("ideaId")?.toString();
    const date = formData.get("date")?.toString();
    const rawTime = formData.get("time")?.toString() || "";
    const timeIsSet = rawTime.length > 0;
    const time = timeIsSet ? rawTime : "12:00";
    const addToGoogleCalendar = formData.get("addToGoogleCalendar") === "true";

    if (!ideaId || !date) {
      redirect(`/spaces/${spaceIdForActions}/calendar`);
    }

    const idea = ideas.find((item) => item.id === ideaId);
    if (!idea) {
      redirect(`/spaces/${spaceIdForActions}/calendar`);
    }

    const dateTimeStart = new Date(`${date}T${time}`);
    if (Number.isNaN(dateTimeStart.getTime())) {
      redirect(`/spaces/${spaceIdForActions}/calendar`);
    }

    const event = await createEventForSpace(spaceIdForActions, currentUserId, {
      title: idea.title,
      description: idea.description,
      dateTimeStart,
      dateTimeEnd: null,
      timeIsSet,
      tags: normalizeTags(parseTags(idea.tags)),
      linkedIdeaId: idea.id,
      placeId: idea.placeId,
      placeName: idea.placeName,
      placeAddress: idea.placeAddress,
      placeWebsite: idea.placeWebsite ?? null,
      placeOpeningHours: Array.isArray(idea.placeOpeningHours)
        ? idea.placeOpeningHours.map((item) => `${item}`)
        : null,
      placePhotoUrls: Array.isArray(idea.placePhotoUrls)
        ? idea.placePhotoUrls.map((item) => `${item}`)
        : null,
      placeLat: idea.placeLat,
      placeLng: idea.placeLng,
      placeUrl: idea.placeUrl,
    });

    // Sync to Google Calendar if requested
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
      googleSync: {
        attempted: false,
        success: true,
      },
    };
  }

  async function handleIdeaComment(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const ideaId = formData.get("ideaId")?.toString();
    const content = formData.get("content")?.toString().trim() ?? "";

    if (!ideaId || !content) {
      return;
    }

    await createIdeaComment(ideaId, currentUserId, content);
  }

  async function handleDeleteIdea(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const ideaId = formData.get("ideaId")?.toString();
    if (!ideaId) {
      return;
    }
    await deleteIdea(ideaId, currentUserId);
    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleUpdateIdea(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const ideaId = formData.get("ideaId")?.toString();
    const title = formData.get("title")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";
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

    if (!ideaId || !title) {
      return;
    }

    await updateIdea(ideaId, currentUserId, {
      title,
      description: description || null,
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

    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleDeleteEvent(
    formData: FormData,
  ): Promise<CalendarActionResult | void> {
    "use server";
    const currentUserId = await requireUserId();
    const eventId = formData.get("eventId")?.toString();
    if (!eventId) {
      return;
    }

    const googleDeleteContext = await getGoogleEventDeleteContext(eventId);
    await deleteEvent(eventId, currentUserId);
    const googleDeleteResult = await cancelGoogleCalendarEvent(googleDeleteContext);

    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);

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

  const monthDays = getMonthGrid(now, weekStartsOn);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const today = new Date();
  const dayLabels = calendarWeekStart === "monday"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const nowLabel = formatEventTime(today, calendarTimeFormat);
  const monthParam = (date: Date) =>
    `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
  const buildCalendarHref = (monthValue: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set("month", monthValue);
    if (density === "compact") {
      params.set("density", "compact");
    }
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        params.set(key, value);
      });
    }
    return `/spaces/${space.id}/calendar?${params.toString()}`;
  };

  const blocksByDay = buildBlocksByDay(blocks);
  const unavailableLegendEntries = Array.from(
    new Set([
      ...blocks.manual.map((block) => block.createdByUserId),
      ...blocks.external.map((block) => block.userId),
    ]),
  )
    .map((userIdValue) => {
      if (!userIdValue) {
        return null;
      }
      const accent = creatorPalette.get(userIdValue);
      const visual = memberVisuals[userIdValue];
      return {
        userId: userIdValue,
        color: accent?.accent ?? "#f59e0b",
        label: visual?.displayName ?? "Unavailable",
      };
    })
    .filter((entry): entry is { userId: string; color: string; label: string } => entry !== null);
  const { ideaCommentCounts, ideaCommentsByIdea } = buildIdeaCommentAggregates(
    ideaComments,
  );
  const eventCommentCounts = buildEventCommentCounts(eventComments);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const ideasForPlanning = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    tags: parseTags(idea.tags),
    createdAt: idea.createdAt,
    createdBy: {
      name: idea.createdBy.name,
      email: idea.createdBy.email,
    },
    createdByUserId: idea.createdByUserId,
    placeId: idea.placeId,
    placeName: idea.placeName,
    placeAddress: idea.placeAddress,
    placeLat: idea.placeLat,
    placeLng: idea.placeLng,
    placeUrl: idea.placeUrl,
    placeWebsite: idea.placeWebsite ?? null,
    placeOpeningHours: Array.isArray(idea.placeOpeningHours)
      ? idea.placeOpeningHours.map((item) => `${item}`)
      : null,
    placePhotoUrls: Array.isArray(idea.placePhotoUrls)
      ? idea.placePhotoUrls.map((item) => `${item}`)
      : null,
  }));

  const editBlock = editBlockId
    ? blocks.manual.find(
        (block) => block.id === editBlockId && block.createdByUserId === userId,
      )
    : null;

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <section className="surface p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 md:items-center">
          <div>
            <p className="section-kicker">Calendar</p>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)] md:text-3xl">
              {formatMonthTitle(now)}
            </h2>
            <p className="section-subtitle">
              Tap any day to add something special or block time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
            <CalendarAddControls
              key={`add-controls-${initialEventDate ?? "none"}-${repeatEventId ?? "none"}-${openAction || "none"}`}
              onCreateEvent={handleCreate}
              onCreateBlock={handleCreateBlock}
              initialEventDate={initialEventDate}
              prefillData={prefillData}
              hasGoogleCalendar={hasGoogleCalendar}
              mapsApiKey={mapsApiKey}
            />
            <Link
              className="pill-button button-hover"
              href={buildCalendarHref(monthParam(prevMonth))}
            >
              Prev
            </Link>
            <Link
              className="pill-button button-hover"
              href={buildCalendarHref(monthParam(today))}
            >
              Today
            </Link>
            <Link
              className="pill-button button-hover"
              href={buildCalendarHref(monthParam(nextMonth))}
            >
              Next
            </Link>
            <div className="flex items-center gap-1 rounded-full border border-[var(--panel-border)] bg-white/80 p-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              <Link
                className={`rounded-full px-3 py-1 transition ${isCompact ? "bg-slate-900 text-white" : "text-[var(--text-muted)]"
                  }`}
                href={buildCalendarHref(monthParam(now), { density: "compact" })}
              >
                Compact
              </Link>
              <Link
                className={`rounded-full px-3 py-1 transition ${!isCompact ? "bg-slate-900 text-white" : "text-[var(--text-muted)]"
                  }`}
                href={buildCalendarHref(monthParam(now), { density: "comfortable" })}
              >
                Comfortable
              </Link>
            </div>
            <a
              className="pill-button button-hover inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--accent-strong)]"
              href={`/api/spaces/${space.id}/calendar.ics`}
              download
              title="Export to calendar app"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export
            </a>
          </div>
        </div>

        {/* Calendar legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Events</span>
          </div>
          {unavailableLegendEntries.length > 0 ? (
            unavailableLegendEntries.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.label} unavailable</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Unavailable</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--action-primary)] text-[8px] font-bold text-white">
              •
            </span>
            <span>Today</span>
          </div>
        </div>

        {/* Check for empty state */}
        {events.length === 0 && blocks.manual.length === 0 && blocks.external.length === 0 ? (
          <div className="mt-8">
            <CalendarEmptyState
              actionHref={buildCalendarHref(monthParam(now), { new: dateKey(now) })}
            />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {dayLabels.map((day) => (
                <div
                  key={day}
                  className="rounded-lg border border-white/80 bg-white/55 px-2 py-1.5 text-center"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthDays.map((day) => {
                const key = dateKey(day.date);
                const dayEvents = eventsByDay.get(key) ?? [];
                const dayBlocks = blocksByDay.get(key) ?? [];
                const todayKey = dateKey(today);
                const isToday = dateKey(day.date) === todayKey;
                const isPast =
                  day.date <
                  new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

                return (
                  <DayCell
                    key={key}
                    date={day.date}
                    isCurrentMonth={day.isCurrentMonth}
                    isToday={isToday}
                    isPast={isPast}
                    isWeekend={isWeekend}
                    isCompact={isCompact}
                    events={dayEvents}
                    blocks={dayBlocks}
                    nowLabel={nowLabel}
                    timeFormat={calendarTimeFormat}
                    addEventHref={buildCalendarHref(monthParam(now), { new: key })}
                    currentUserId={userId}
                    creatorPalette={creatorPalette}
                    memberVisuals={memberVisuals}
                    buildBlockEditHref={(blockId) =>
                      buildCalendarHref(monthParam(now), { editBlock: blockId })
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </section>
      <PlanningSection>
        <div className="flex flex-col gap-8">
          <IdeasColumn
            key={autoOpenIdea ? "ideas-auto-open" : "ideas-default"}
            ideas={ideasForPlanning}
            commentCounts={ideaCommentCounts}
            commentsByIdea={ideaCommentsByIdea}
            currentUserId={userId}
            memberVisuals={memberVisuals}
            mapsApiKey={mapsApiKey}
            hasGoogleCalendar={hasGoogleCalendar}
            onCreateIdea={handleCreateIdea}
            onScheduleIdea={handleScheduleIdea}
            onAddComment={handleIdeaComment}
            onDeleteIdea={handleDeleteIdea}
            onEditIdea={handleUpdateIdea}
            autoOpen={autoOpenIdea}
          />
          <UpcomingPlansColumn
            plans={upcomingEvents.map((event) => ({
              id: event.id,
              title: event.title,
              description: event.description,
              dateTimeStart: event.dateTimeStart,
              timeIsSet: event.timeIsSet,
              createdBy: event.createdBy
                ? {
                    name:
                      memberVisuals[event.createdByUserId]?.displayName ??
                      event.createdBy.name,
                    email: event.createdBy.email,
                  }
                : undefined,
              placeName: event.placeName,
            }))}
            commentCounts={eventCommentCounts}
            newEventHref={buildCalendarHref(monthParam(today), { new: formatDateInput(today) })}
            timeFormat={calendarTimeFormat}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
      </PlanningSection>
      <AvailabilityBlockModal
        isOpen={Boolean(editBlock)}
        onCloseHref={buildCalendarHref(monthParam(now))}
        onSubmit={handleUpdateBlock}
        block={
          editBlock
            ? {
              id: editBlock.id,
              title: editBlock.title,
              note: editBlock.note,
              startDate: formatDateInput(editBlock.startAt),
              endDate: formatDateInput(editBlock.endAt),
            }
            : null
        }
      />
      <OnboardingTour spaceId={space.id} />
    </>
  );
}
