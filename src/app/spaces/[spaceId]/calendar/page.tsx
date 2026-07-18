import Link from "next/link";
import type { GoogleSyncStatus } from "@/lib/google-sync";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import {
  dateKey,
  dateKeyInTimeZone,
  formatMonthTitle,
  getMonthGrid,
  resolveCalendarTimeFormat,
  resolveCalendarTimeZone,
  shiftDateKey,
  utcDateKey,
} from "@/lib/calendar";
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
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
  getIdeaForUser,
  updateIdea,
} from "@/lib/ideas";
import { normalizeTags, parseTags } from "@/lib/tags";
import {
  cancelGoogleCalendarEvent,
  createGoogleCalendarEvent,
  getGoogleEventDeleteContext,
} from "@/lib/integrations/google/events";
import { parseLocalDateTime, parseOffsetMinutes } from "@/lib/date-time";
import { parseEventFormData, parsePlaceFields } from "@/lib/event-form";
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
import CalendarTimeZoneSync from "@/components/calendar/CalendarTimeZoneSync";
import GoogleCalendarAutoSync from "@/components/calendar/GoogleCalendarAutoSync";
import DayCell from "./day-cell";
import MobileAgendaView from "@/components/calendar/MobileAgendaView";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

type PageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams?: Promise<{
    month?: string;
    new?: string;
    editBlock?: string;
    repeat?: string;
    action?: string;
    density?: string;
    tour?: string;
    tourStep?: string;
  }>;
};

type CalendarActionResult = {
  googleSync?: GoogleSyncStatus;
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
  const calendarTimeZone = resolveCalendarTimeZone(
    cookieStore.get("cm_time_zone")?.value,
  );
  const weekStartsOn: 0 | 1 = calendarWeekStart === "monday" ? 1 : 0;
  const userId = await requireUserId();
  const { spaceId } = await params;
  const search = (await searchParams) ?? {};
  const actualToday = new Date();
  const localTodayKey = dateKeyInTimeZone(actualToday, calendarTimeZone);
  const selectedMonth = search.month
    ? new Date(`${search.month}-01T00:00:00`)
    : new Date(`${localTodayKey}T00:00:00`);
  const now = Number.isNaN(selectedMonth.getTime()) ? new Date() : selectedMonth;
  const density = search.density === "compact" ? "compact" : "comfortable";
  const isCompact = density === "compact";
  const initialEventDate =
    search.new && /^\d{4}-\d{2}-\d{2}$/.test(search.new) ? search.new : null;
  const editBlockId = search.editBlock ?? null;
  const repeatEventId = search.repeat ?? null;
  const openAction = search.action ?? "";
  const autoOpenIdea = openAction === "idea";
  const autoOpenBlock = openAction === "block";
  const forceTourOpen = search.tour === "1";
  const forcedTourStepRaw = Number.parseInt(search.tourStep ?? "", 10);
  const forcedTourStep = Number.isFinite(forcedTourStepRaw) ? forcedTourStepRaw : 0;
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    redirect("/spaces/onboarding");
  }
  // Store space ID for use in server actions (avoids TypeScript narrowing issues)
  const spaceIdForActions = space.id;

  // Widen the UTC query window so events near a month boundary are still
  // available for grouping in the viewer's local time zone.
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0));
  const monthEnd = new Date(
    Date.UTC(now.getFullYear(), now.getMonth() + 1, 2, 23, 59, 59, 999),
  );
  const {
    events,
    blocks,
    ideas,
    upcomingEvents,
    ideaComments,
    eventComments,
    hasGoogleCalendar,
    googleAvailabilitySync,
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

  const eventsByDay = buildEventsByDay(events, calendarTimeZone);

  async function handleCreate(formData: FormData): Promise<CalendarActionResult | void> {
    "use server";
    const currentUserId = await requireUserId();
    const parsed = parseEventFormData(formData);

    const event = await createEventForSpace(spaceIdForActions, currentUserId, {
      title: parsed.title,
      description: parsed.description,
      dateTimeStart: parsed.dateTimeStart,
      dateTimeEnd: parsed.dateTimeEnd,
      timeIsSet: parsed.timeIsSet,
      tags: parsed.tags,
      placeId: parsed.placeId,
      placeName: parsed.placeName,
      placeAddress: parsed.placeAddress,
      placeWebsite: parsed.placeWebsite,
      placeOpeningHours: parsed.placeOpeningHours,
      placePhotoUrls: parsed.placePhotoUrls,
      placeLat: parsed.placeLat,
      placeLng: parsed.placeLng,
      placeUrl: parsed.placeUrl,
    });
    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);

    // Sync to Google Calendar if requested
    if (parsed.addToGoogleCalendar) {
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
      throw new Error("Title and start/end dates are required.");
    }

    const startAt = new Date(`${start}T00:00:00.000Z`);
    const endAt = new Date(`${end}T23:59:59.999Z`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new Error("Invalid date range. Please try again.");
    }

    await createAvailabilityBlock(spaceIdForActions, currentUserId, {
      title,
      note: note || null,
      startAt,
      endAt,
    });
    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);

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
      throw new Error("Title and start/end dates are required.");
    }

    const startAt = new Date(`${start}T00:00:00.000Z`);
    const endAt = new Date(`${end}T23:59:59.999Z`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new Error("Invalid date range. Please try again.");
    }

    await updateAvailabilityBlock(blockId, currentUserId, {
      title,
      note: note || null,
      startAt,
      endAt,
    });

    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleDeleteBlock(blockId: string) {
    "use server";
    const currentUserId = await requireUserId();

    if (!blockId) {
      throw new Error("Missing availability block.");
    }

    await deleteAvailabilityBlock(blockId, currentUserId);
    revalidatePath(`/spaces/${spaceIdForActions}/calendar`);
  }

  async function handleCreateIdea(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const title = formData.get("title")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";
    const tags = normalizeTags(formData.get("tags"));
    const place = parsePlaceFields(formData);

    if (!title) {
      redirect(`/spaces/${spaceIdForActions}/calendar`);
    }

    await createIdeaForSpace(spaceIdForActions, currentUserId, {
      title,
      description: description || null,
      tags,
      ...place,
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

    const idea = await getIdeaForUser(ideaId, currentUserId);
    if (!idea) {
      redirect(`/spaces/${spaceIdForActions}/calendar`);
    }

    const offsetMinutes = parseOffsetMinutes(formData.get("timeZoneOffsetStart"));
    const dateTimeStart =
      parseLocalDateTime({ date, time, offsetMinutes }) ??
      new Date(`${date}T${time}`);
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
    const place = parsePlaceFields(formData);

    if (!ideaId || !title) {
      return;
    }

    await updateIdea(ideaId, currentUserId, {
      title,
      description: description || null,
      tags,
      ...place,
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
  const agendaTodayKey = dateKeyInTimeZone(actualToday, calendarTimeZone);
  const today = new Date(`${agendaTodayKey}T00:00:00`);
  const dayLabels = calendarWeekStart === "monday"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

  const blocksByDay = buildBlocksByDay(blocks, calendarTimeZone);
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
    ? blocks.manual.find((block) => block.id === editBlockId)
    : null;

  const formatDateInput = (date: Date) => utcDateKey(date);

  // Build serialized agenda data for mobile view
  const todayStart = actualToday;
  const agendaDays = (() => {
    const dayMap = new Map<string, { events: typeof events; blocks: ReturnType<typeof blocksByDay.get> }>();

    for (const day of monthDays) {
      if (!day.isCurrentMonth) continue;
      const key = dateKey(day.date);
      const dayEvents = eventsByDay.get(key) ?? [];
      const dayBlocks = blocksByDay.get(key) ?? [];
      if (dayEvents.length > 0 || dayBlocks.length > 0) {
        dayMap.set(key, { events: dayEvents, blocks: dayBlocks });
      }
    }

    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        dateKey: key,
        // No trailing Z: the client intentionally parses this as a local
        // calendar date instead of shifting it across a UTC boundary.
        dateIso: `${key}T00:00:00`,
        events: (data.events ?? []).map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description ?? null,
          dateTimeStartIso: event.dateTimeStart.toISOString(),
          dateTimeEndIso: event.dateTimeEnd?.toISOString() ?? null,
          timeIsSet: event.timeIsSet,
          placeName: event.placeName,
          isPast: event.dateTimeStart < todayStart,
          createdByUserId: event.createdByUserId,
        })),
        blocks: (data.blocks ?? []).map((block) => {
          const createdByUserId = block.createdByUserId || "external";
          const visual = memberVisuals[createdByUserId];
          return {
            id: block.id,
            title: block.title,
            startAtIso: block.startAt.toISOString(),
            endAtIso: block.endAt.toISOString(),
            creatorName: visual?.displayName ?? block.createdBy.name ?? block.createdBy.email,
            source: block.source,
            editHref:
              block.source === "GOOGLE"
                ? null
                : buildCalendarHref(monthParam(now), { editBlock: block.id }),
            accentColor: visual?.accent.accent ?? "var(--color-secondary)",
            accentSoft: visual?.accent.accentSoft ?? "var(--color-secondary-soft)",
            accentText: visual?.accent.accentText ?? "var(--idea-new-text)",
          };
        }),
      }));
  })();
  // Compact month grid for the mobile calendar strip
  const agendaMonthGrid = {
    weekStartsOn,
    days: monthDays
      .filter((day) => day.isCurrentMonth)
      .map((day) => {
        const key = dateKey(day.date);
        const dayEvents = eventsByDay.get(key) ?? [];
        const dayBlocks = blocksByDay.get(key) ?? [];
        const prevIds = new Set(
          (blocksByDay.get(shiftDateKey(key, -1)) ?? []).map((block) => block.id),
        );
        const nextIds = new Set(
          (blocksByDay.get(shiftDateKey(key, 1)) ?? []).map((block) => block.id),
        );
        const blockAccentColors = Array.from(
          new Set(
            dayBlocks.map((block) => {
              const createdByUserId = block.createdByUserId || "external";
              return (
                memberVisuals[createdByUserId]?.accent.accent ??
                "var(--color-secondary)"
              );
            }),
          ),
        );
        return {
          dateKey: key,
          dayOfMonth: day.date.getDate(),
          isToday: key === agendaTodayKey,
          hasPlan: dayEvents.some((event) => event.dateTimeStart >= todayStart),
          hasMemory: dayEvents.some((event) => event.dateTimeStart < todayStart),
          hasBlock: dayBlocks.length > 0,
          blockSpansPrev: dayBlocks.some((block) => prevIds.has(block.id)),
          blockSpansNext: dayBlocks.some((block) => nextIds.has(block.id)),
          blockAccentColors,
          addHref: buildCalendarHref(monthParam(now), { new: key }),
        };
      }),
  };

  return (
    <>
      <CalendarTimeZoneSync serverTimeZone={calendarTimeZone} />
      <GoogleCalendarAutoSync
        {...googleAvailabilitySync}
        settingsHref={`/spaces/${space.id}/settings`}
      />
      <section className="surface overflow-hidden p-4 md:p-8">
        {/* One-row header: create actions · month nav · view tools. The old
            version stacked kicker + helper + two mini-rows into a ~110px band. */}
        <div className="grid items-center gap-4 xl:grid-cols-[1fr_auto_1fr]">
          <CalendarAddControls
            key={`add-controls-${initialEventDate ?? "none"}-${repeatEventId ?? "none"}-${openAction || "none"}`}
            onCreateEvent={handleCreate}
            onCreateBlock={handleCreateBlock}
            initialEventDate={initialEventDate}
            prefillData={prefillData}
            autoOpenBlock={autoOpenBlock}
            hasGoogleCalendar={hasGoogleCalendar}
            mapsApiKey={mapsApiKey}
          />
          {/* On mobile the month nav lives inside the agenda's month strip. */}
          <div className="hidden items-center gap-1 md:flex xl:justify-self-center">
            <Link
              aria-label="Previous month"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-white hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)]"
              href={buildCalendarHref(monthParam(prevMonth))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h2 className="min-w-[220px] whitespace-nowrap px-2 text-center text-3xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)]">
              {formatMonthTitle(now)}
            </h2>
            <Link
              aria-label="Next month"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-white hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)]"
              href={buildCalendarHref(monthParam(nextMonth))}
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              className="pill-button button-hover ml-2 px-3 py-1.5 text-xs"
              href={buildCalendarHref(monthParam(today))}
            >
              Today
            </Link>
          </div>
          <div className="hidden flex-wrap items-center gap-2 md:flex xl:justify-self-end">
            <div className="flex items-center gap-0.5 rounded-full border border-[var(--panel-border)] bg-white/80 p-0.5 text-xs font-medium">
              <Link
                className={`rounded-full px-3 py-1.5 transition ${isCompact ? "bg-[var(--action-primary)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                href={buildCalendarHref(monthParam(now), { density: "compact" })}
              >
                Compact
              </Link>
              <Link
                className={`rounded-full px-3 py-1.5 transition ${!isCompact ? "bg-[var(--action-primary)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                href={buildCalendarHref(monthParam(now), { density: "comfortable" })}
              >
                Comfortable
              </Link>
            </div>
            <a
              aria-label="Export to calendar app"
              className="pill-button button-hover flex h-9 w-9 items-center justify-center !p-0"
              href={`/api/spaces/${space.id}/calendar.ics`}
              download
              title="Export to calendar app"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        </div>
        {/* Legend - desktop only */}
        <div className="mt-3 hidden flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)] md:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Your plans
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--calendar-memory-dot)]" />
            Memories
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-secondary)]" />
            Manual busy
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--panel-border)] px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-[var(--color-secondary)]" />
            Google busy
          </span>
        </div>

        {/* Mobile agenda view */}
        <div className="mt-4 md:hidden">
          <MobileAgendaView
            days={agendaDays}
            todayKey={agendaTodayKey}
            timeFormat={calendarTimeFormat}
            monthTitle={formatMonthTitle(now)}
            monthGrid={agendaMonthGrid}
            prevHref={buildCalendarHref(monthParam(prevMonth))}
            nextHref={buildCalendarHref(monthParam(nextMonth))}
          />
        </div>

        {/* Desktop month grid */}
        <div className="mt-4 hidden grid-cols-7 gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] md:grid sm:gap-2">
          {dayLabels.map((day) => (
            <div
              key={day}
              className="rounded-lg border border-white/80 bg-white/55 px-1 py-1.5 text-center sm:px-2"
            >
              <span className="sm:hidden">{day[0]}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 hidden grid-cols-7 gap-1 md:grid sm:mt-2 sm:gap-2">
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
                timeFormat={calendarTimeFormat}
                timeZone={calendarTimeZone}
                addEventHref={buildCalendarHref(monthParam(now), { new: key })}
                currentUserId={userId}
                memberVisuals={memberVisuals}
                referenceNow={today}
                buildBlockEditHref={(blockId) =>
                  buildCalendarHref(monthParam(now), { editBlock: blockId })
                }
              />
            );
          })}
        </div>
        {events.length === 0 && blocks.manual.length === 0 && blocks.external.length === 0 ? (
          <div className="mt-6 hidden md:block">
            <CalendarEmptyState
              actionHref={buildCalendarHref(monthParam(now), { new: dateKey(now) })}
            />
          </div>
        ) : null}
      </section>
      <div className="hidden md:block">
        <PlanningSection>
          <div className="flex flex-col gap-8">
            <IdeasColumn
              key={autoOpenIdea ? "ideas-auto-open" : "ideas-default"}
              ideas={ideasForPlanning}
              spaceId={space.id}
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
      </div>
      <AvailabilityBlockModal
        isOpen={Boolean(editBlock)}
        onCloseHref={buildCalendarHref(monthParam(now))}
        onSubmit={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        block={
          editBlock
            ? {
                id: editBlock.id,
                title: editBlock.title,
                note: editBlock.note,
                startDate: formatDateInput(editBlock.startAt),
                endDate: formatDateInput(editBlock.endAt),
                canEdit: editBlock.createdByUserId === userId,
                createdByName:
                  memberVisuals[editBlock.createdByUserId]?.displayName ??
                  editBlock.createdBy.name ??
                  editBlock.createdBy.email,
              }
            : null
        }
      />
      <OnboardingTour
        key={`onboarding-tour-${forceTourOpen ? "forced" : "auto"}-${forcedTourStep}`}
        spaceId={space.id}
        forceOpen={forceTourOpen}
        initialStep={forcedTourStep}
        autoOpen={events.length === 0 && ideas.length === 0}
      />
    </>
  );
}


