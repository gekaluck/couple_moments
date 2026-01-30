import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCoupleSpaceForUser, listSpaceMembers } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import {
  dateKey,
  formatEventTime,
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
import { buildCreatorPalette, getCreatorInitials } from "@/lib/creator-colors";
import CalendarAddControls from "./add-controls";
import PlanningSection from "@/components/planning/PlanningSection";
import IdeasColumn from "@/components/planning/IdeasColumn";
import UpcomingPlansColumn from "@/components/planning/UpcomingPlansColumn";
import AvailabilityBlockModal from "./availability-block-modal";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import EventBubble from "./event-bubble";

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
  const calendarTimeFormat =
    cookieStore.get("cm_calendar_time_format")?.value === "12h"
      ? "12h"
      : "24h";
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
  const upcomingEnd = new Date(actualToday);
  upcomingEnd.setDate(actualToday.getDate() + 14);
  const upcomingEvents = await listEventsForSpace({
    spaceId: space.id,
    from: actualToday,
    to: upcomingEnd,
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

    await createEventForSpace(spaceIdForActions, currentUserId, {
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

    await createEventForSpace(spaceIdForActions, currentUserId, {
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

  const blocksByDay = new Map<string, typeof blocks>();
  for (const block of blocks) {
    const cursor = new Date(block.startAt);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(block.endAt);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = dateKey(cursor);
      const list = blocksByDay.get(key) ?? [];
      list.push(block);
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
    ? blocks.find((block) => block.id === editBlockId)
    : null;

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <section className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Calendar</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              {formatMonthTitle(now)}
            </h2>
            <p className="section-subtitle">
              Tap any day to add something special or block time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
            <CalendarAddControls
              onCreateEvent={handleCreate}
              onCreateBlock={handleCreateBlock}
              initialEventDate={initialEventDate}
              prefillData={prefillData}
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
                className={`rounded-full px-3 py-1 transition ${
                  isCompact ? "bg-slate-900 text-white" : "text-[var(--text-muted)]"
                }`}
                href={buildCalendarHref(monthParam(now), { density: "compact" })}
              >
                Compact
              </Link>
              <Link
                className={`rounded-full px-3 py-1 transition ${
                  !isCompact ? "bg-slate-900 text-white" : "text-[var(--text-muted)]"
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
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-tertiary)]">
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            Upcoming
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Memory
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-amber-400" />
            Unavailable
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {dayLabels.map((day) => (
            <div key={day} className="px-2 py-1">
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
            const maxEvents = isCompact ? 2 : 3;
            const visibleEvents = dayEvents.slice(0, maxEvents);
            const overflowCount = Math.max(dayEvents.length - maxEvents, 0);
            const dayCellBase = isCompact ? "min-h-[90px] p-1.5" : "min-h-[120px] p-2";

            return (
              <div
                key={key}
                className={`relative rounded-xl border text-xs transition hover:shadow-[var(--shadow-sm)] ${dayCellBase} ${
                  day.isCurrentMonth
                    ? isWeekend
                      ? "bg-rose-50/50"
                      : "bg-white/80"
                    : "bg-white/40 text-[var(--text-muted)]"
                } ${isPast ? "opacity-60" : ""} ${
                  isToday
                    ? "border-rose-400 border-2"
                    : "border-[var(--panel-border)]"
                }`}
              >
                <Link
                  aria-label={`Add event on ${key}`}
                  className="absolute inset-0 z-0"
                  href={buildCalendarHref(monthParam(now), { new: key })}
                />
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
                  {day.date.getDate()}
                  {isToday ? (
                    <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                      Today
                    </span>
                  ) : null}
                </div>
                {isToday ? (
                  <div className="mt-1 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse-soft" />
                    Now {nowLabel}
                  </div>
                ) : null}
                <div className="relative z-10 mt-2 flex flex-col gap-1">
                  {dayBlocks.map((block) => {
                    const blockAccent =
                      creatorPalette.get(block.createdByUserId)?.accent ??
                      "var(--accent-secondary)";
                    const blockSoft =
                      creatorPalette.get(block.createdByUserId)?.accentSoft ??
                      "#fef3c7";
                    const blockText =
                      creatorPalette.get(block.createdByUserId)?.accentText ??
                      "#b45309";
                    const initials = getCreatorInitials({
                      id: block.createdByUserId,
                      name: block.createdBy?.name ?? null,
                      email: block.createdBy?.email ?? "??",
                    });
                    return (
                      <Link
                        key={block.id}
                        className="rounded-lg border-2 border-dashed px-2 py-1 text-xs transition hover:shadow-[var(--shadow-sm)] opacity-80"
                        href={buildCalendarHref(monthParam(now), {
                          editBlock: block.id,
                        })}
                        style={{
                          borderColor: blockAccent,
                          backgroundColor: blockSoft,
                          color: blockText,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1 truncate font-semibold">
                            <svg
                              aria-hidden="true"
                              className="h-3 w-3 flex-shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                              <path
                                d="M12 7.5v5l3 2"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="truncate">{block.title}</span>
                          </span>
                          <span
                            className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: blockAccent }}
                          >
                            {initials}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {visibleEvents.map((event) => {
                    const eventIsPast = event.dateTimeStart < today;
                    const eventTime =
                      event.timeIsSet && event.dateTimeStart
                        ? formatEventTime(event.dateTimeStart, calendarTimeFormat)
                        : null;
                    return (
                      <EventBubble
                        key={event.id}
                        href={`/events/${event.id}`}
                        title={event.title}
                        timeLabel={eventTime}
                        isPast={eventIsPast}
                      />
                    );
                  })}
                  {overflowCount > 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--panel-border)] px-2 py-1 text-[10px] text-[var(--text-muted)]">
                      ... +{overflowCount} more
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <PlanningSection
        actions={(
          <Link
            className="pill-button button-hover"
            href={buildCalendarHref(monthParam(today))}
          >
            Today
          </Link>
        )}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <IdeasColumn
            ideas={ideasForPlanning}
            commentCounts={ideaCommentCounts}
            commentsByIdea={ideaCommentsByIdea}
            currentUserId={userId}
            mapsApiKey={mapsApiKey}
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
            todayHref={buildCalendarHref(monthParam(today))}
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
