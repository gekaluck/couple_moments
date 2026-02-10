import { dateKey } from "@/lib/calendar";
import { listSpaceMembers } from "@/lib/couple-spaces";
import { buildCreatorPalette, buildCreatorVisuals } from "@/lib/creator-colors";
import { listAvailabilityBlocks } from "@/lib/availability";
import {
  getEventForUser,
  listEventCommentsForEvents,
  listEventsForSpace,
} from "@/lib/events";
import { hasGoogleCalendarWithEventsScope } from "@/lib/integrations/google/events";
import { listIdeaCommentsForIdeas, listIdeasForSpace } from "@/lib/ideas";
import { parseTags } from "@/lib/tags";

type CalendarEvents = Awaited<ReturnType<typeof listEventsForSpace>>;
type CalendarBlocks = Awaited<ReturnType<typeof listAvailabilityBlocks>>;
type IdeaComments = Awaited<ReturnType<typeof listIdeaCommentsForIdeas>>;
type EventComments = Awaited<ReturnType<typeof listEventCommentsForEvents>>;

export type CalendarPrefillData = {
  title: string;
  description: string;
  tags: string;
  placeId: string | null;
  placeName: string | null;
  placeAddress: string | null;
  placeLat: number | null;
  placeLng: number | null;
  placeUrl: string | null;
  placeWebsite: string | null;
  placeOpeningHours: string[] | null;
  placePhotoUrls: string[] | null;
} | null;

export type CalendarDayBlock = {
  id: string;
  startAt: Date;
  endAt: Date;
  title: string;
  createdBy: { name: string | null; email: string };
  createdByUserId?: string;
  source?: string;
};

export async function loadCalendarPageData(params: {
  spaceId: string;
  userId: string;
  monthStart: Date;
  monthEnd: Date;
  repeatEventId: string | null;
  actualToday: Date;
}) {
  const { spaceId, userId, monthStart, monthEnd, repeatEventId, actualToday } = params;

  const [repeatEvent, events, members, hasGoogleCalendar, blocks, ideas, upcomingEvents] =
    await Promise.all([
      repeatEventId ? getEventForUser(repeatEventId, userId) : Promise.resolve(null),
      listEventsForSpace({
        spaceId,
        from: monthStart,
        to: monthEnd,
      }),
      listSpaceMembers(spaceId),
      hasGoogleCalendarWithEventsScope(userId),
      listAvailabilityBlocks({
        spaceId,
        from: monthStart,
        to: monthEnd,
      }),
      listIdeasForSpace({ spaceId, status: "NEW" }),
      listEventsForSpace({
        spaceId,
        from: actualToday,
        timeframe: "upcoming",
      }),
    ]);

  const [ideaComments, eventComments] = await Promise.all([
    listIdeaCommentsForIdeas(ideas.map((idea) => idea.id)),
    listEventCommentsForEvents(upcomingEvents.map((event) => event.id)),
  ]);

  const creatorPalette = buildCreatorPalette(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name ?? null,
      email: member.user.email,
      alias: member.alias,
      initials: member.initials,
      color: member.color,
    })),
  );
  const memberVisuals = buildCreatorVisuals(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name ?? null,
      email: member.user.email,
      alias: member.alias,
      initials: member.initials,
      color: member.color,
    })),
  );

  const prefillData: CalendarPrefillData = repeatEvent
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

  return {
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
  };
}

export function buildEventsByDay(events: CalendarEvents) {
  const eventsByDay = new Map<string, CalendarEvents>();
  for (const event of events) {
    const key = dateKey(event.dateTimeStart);
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }
  return eventsByDay;
}

export function buildBlocksByDay(blocks: CalendarBlocks) {
  const blocksByDay = new Map<string, CalendarDayBlock[]>();

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

  return blocksByDay;
}

export function buildIdeaCommentAggregates(ideaComments: IdeaComments) {
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

  return {
    ideaCommentCounts,
    ideaCommentsByIdea,
  };
}

export function buildEventCommentCounts(eventComments: EventComments) {
  return eventComments.reduce<Record<string, number>>((acc, comment) => {
    if (!comment.parentId) {
      return acc;
    }
    acc[comment.parentId] = (acc[comment.parentId] ?? 0) + 1;
    return acc;
  }, {});
}
