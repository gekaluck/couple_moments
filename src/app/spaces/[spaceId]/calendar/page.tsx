import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCoupleSpaceForUser, listSpaceMembers } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import {
  dateKey,
  formatMonthTitle,
  getMonthGrid,
} from "@/lib/calendar";
import {
  createAvailabilityBlock,
  listAvailabilityBlocks,
  updateAvailabilityBlock,
} from "@/lib/availability";
import {
  createEventForSpace,
  getEventForUser,
  listEventCommentsForEvents,
  listEventsForSpace,
} from "@/lib/events";
import {
  createIdeaComment,
  createIdeaForSpace,
  deleteIdea,
  listIdeaCommentsForIdeas,
  listIdeasForSpace,
  updateIdea,
} from "@/lib/ideas";
import { normalizeTags, parseTags } from "@/lib/tags";
import { buildCreatorPalette } from "@/lib/creator-colors";
import { hasGoogleCalendarWithEventsScope, createGoogleCalendarEvent } from "@/lib/integrations/google/events";
import CalendarAddControls from "./add-controls";
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

export default async function CalendarPage({ params, searchParams }: PageProps) {
  const cookieStore = await cookies();
  const calendarWeekStart =
    cookieStore.get("cm_calendar_week_start")?.value === "monday"
      ? "monday"
      : "sunday";
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

  // Fetch event to repeat if repeat param is present
  const repeatEvent = repeatEventId
    ? await getEventForUser(repeatEventId, userId)
    : null;
  const prefillData = repeatEvent
    ? {
      title: repeatEvent.title,
      description: repeatEvent.description ?? "",
      tags: parseTags(repeatEvent.tags).join(", "),
      placeId: repeatEvent.placeId,
      placeName: repeatEvent.placeName,
      placeAddress: repeatEvent.placeAddress,
      placeLat: repeatEvent.placeLat,
      placeLng: repeatEvent.placeLng,
      placeUrl: repeatEvent.placeUrl,
      placeWebsite: repeatEvent.placeWebsite,
      placeOpeningHours: Array.isArray(repeatEvent.placeOpeningHours)
        ? (repeatEvent.placeOpeningHours as string[])
        : null,
      placePhotoUrls: Array.isArray(repeatEvent.placePhotoUrls)
        ? (repeatEvent.placePhotoUrls as string[])
        : null,
    }
    : null;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const events = await listEventsForSpace({
    spaceId: space.id,
    from: monthStart,
    to: monthEnd,
  });
  const members = await listSpaceMembers(space.id);
  const hasGoogleCalendar = await hasGoogleCalendarWithEventsScope(userId);
  const creatorPalette = buildCreatorPalette(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name ?? null,
      email: member.user.email,
    })),
  );
  const blocks = await listAvailabilityBlocks({
    spaceId: space.id,
    from: monthStart,
    to: monthEnd,
  });
  const ideas = await listIdeasForSpace({ spaceId: space.id, status: "NEW" });
  // Use actual current date for upcoming plans, not the selected calendar month
  const actualToday = new Date();
  const upcomingEvents = await listEventsForSpace({
    spaceId: space.id,
    from: actualToday,
    timeframe: "upcoming",
  });
  const ideaComments = await listIdeaCommentsForIdeas(ideas.map((idea) => idea.id));
  const eventComments = await listEventCommentsForEvents(
    upcomingEvents.map((event) => event.id),
  );

  const eventsByDay = new Map<string, typeof events>();
  for (const event of events) {
    const key = dateKey(event.dateTimeStart);
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }

  async function handleCreate(formData: FormData) {
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
    const parseJsonArray = (value?: string | null) => {
      if (!value) {
        return null;
      }
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => `${item}`);
        }
        return null;
      } catch {
        return null;
      }
    };
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
      await createGoogleCalendarEvent(currentUserId, {
        id: event.id,
        title: event.title,
        description: event.description,
        dateTimeStart: event.dateTimeStart,
        dateTimeEnd: event.dateTimeEnd,
        timeIsSet: event.timeIsSet,
        placeName: event.placeName,
        placeAddress: event.placeAddress,
      });
    }

    return;
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
    const parseJsonArray = (value?: string | null) => {
      if (!value) {
        return null;
      }
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => `${item}`);
        }
        return null;
      } catch {
        return null;
      }
    };
    const placeOpeningHours = parseJsonArray(
      formData.get("placeOpeningHours")?.toString() ?? null,
    );
    const placePhotoUrls = parseJsonArray(
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

  async function handleScheduleIdea(formData: FormData) {
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
      await createGoogleCalendarEvent(currentUserId, {
        id: event.id,
        title: event.title,
        description: event.description,
        dateTimeStart: event.dateTimeStart,
        dateTimeEnd: event.dateTimeEnd,
        timeIsSet: event.timeIsSet,
        placeName: event.placeName,
        placeAddress: event.placeAddress,
      });
    }

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
    const parseJsonArray = (value?: string | null) => {
      if (!value) {
        return null;
      }
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => `${item}`);
        }
        return null;
      } catch {
        return null;
      }
    };
    const placeOpeningHours = parseJsonArray(
      formData.get("placeOpeningHours")?.toString() ?? null,
    );
    const placePhotoUrls = parseJsonArray(
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

  const monthDays = getMonthGrid(now, weekStartsOn);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const today = new Date();
  const dayLabels = calendarWeekStart === "monday"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const nowLabel = today.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
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
  const blocksByDay = new Map<string, Array<{ id: string; startAt: Date; endAt: Date; title: string; createdBy: { name: string | null; email: string }; createdByUserId?: string; source?: string }>>();
  
  // Add manual blocks
  for (const block of blocks.manual) {
    const cursor = new Date(block.startAt);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(block.endAt);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = dateKey(cursor);
      const list = blocksByDay.get(key) ?? [];
      list.push({
        id: block.id,
        startAt: block.startAt,
        endAt: block.endAt,
        title: block.title,
        createdBy: { name: block.createdBy.name, email: block.createdBy.email },
        createdByUserId: block.createdByUserId,
      });
      blocksByDay.set(key, list);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  
  // Add external blocks
  for (const block of blocks.external) {
    const cursor = new Date(block.startAt);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(block.endAt);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = dateKey(cursor);
      const list = blocksByDay.get(key) ?? [];
      list.push({
        id: block.id,
        startAt: block.startAt,
        endAt: block.endAt,
        title: "Busy",
        createdBy: { name: block.user.name, email: block.user.email },
        createdByUserId: block.userId,
        source: block.source,
      });
      blocksByDay.set(key, list);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const ideaCommentCounts = ideaComments.reduce<Record<string, number>>(
    (acc, comment) => {
      if (!comment.parentId) {
        return acc;
      }
      acc[comment.parentId] = (acc[comment.parentId] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const ideaCommentsByIdea = ideaComments.reduce<
    Record<
      string,
      Array<{
        id: string;
        body: string;
        createdAt: string;
        author: { id: string; name: string | null; email: string };
      }>
    >
  >((acc, comment) => {
    if (!comment.parentId) {
      return acc;
    }
    acc[comment.parentId] = acc[comment.parentId] ?? [];
    acc[comment.parentId].push({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        name: comment.author.name,
        email: comment.author.email,
      },
    });
    return acc;
  }, {});
  const eventCommentCounts = eventComments.reduce<Record<string, number>>(
    (acc, comment) => {
      if (!comment.parentId) {
        return acc;
      }
      acc[comment.parentId] = (acc[comment.parentId] ?? 0) + 1;
      return acc;
    },
    {},
  );
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
              Build a cozy rhythm for both of you, one day at a time.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                Plans
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--color-secondary)]" />
                Busy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
                Memories
              </span>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-start gap-3 lg:w-auto lg:justify-end">
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <CalendarAddControls
                onCreateEvent={handleCreate}
                onCreateBlock={handleCreateBlock}
                initialEventDate={initialEventDate}
                prefillData={prefillData}
                hasGoogleCalendar={hasGoogleCalendar}
              />
              <div className="flex min-w-fit items-center rounded-full border border-[var(--panel-border)] bg-white/90 p-1 shadow-[var(--shadow-sm)]">
                <Link
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-50)] hover:text-[var(--text-primary)]"
                  href={buildCalendarHref(monthParam(prevMonth))}
                >
                  Prev
                </Link>
                <Link
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-50)]"
                  href={buildCalendarHref(monthParam(today))}
                >
                  Today
                </Link>
                <Link
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-50)] hover:text-[var(--text-primary)]"
                  href={buildCalendarHref(monthParam(nextMonth))}
                >
                  Next
                </Link>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <a
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--panel-border)] bg-white/90 px-3 py-2 text-xs font-medium text-[var(--text-muted)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]"
                href={`/api/spaces/${space.id}/calendar.ics`}
                download
                title="Export to calendar app"
                aria-label="Export calendar as ICS"
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
                    addEventHref={buildCalendarHref(monthParam(now), { new: key })}
                    creatorPalette={creatorPalette}
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
            ideas={ideasForPlanning}
            commentCounts={ideaCommentCounts}
            commentsByIdea={ideaCommentsByIdea}
            currentUserId={userId}
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
                ? { name: event.createdBy.name, email: event.createdBy.email }
                : undefined,
              placeName: event.placeName,
            }))}
            commentCounts={eventCommentCounts}
            newEventHref={buildCalendarHref(monthParam(today), { new: formatDateInput(today) })}
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
