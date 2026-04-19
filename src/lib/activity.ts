import { prisma } from "@/lib/prisma";

type ActivityEntry = {
  id: string;
  createdAt: Date;
  action: string;
  entityType: "EVENT" | "IDEA" | "COMMENT" | "NOTE";
  entityId?: string | null;
  entityTitle?: string | null;
  entityHref?: string | null;
  details?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type ActivityQueryOptions = {
  skip?: number;
  take?: number;
};

type ChangeLogFilters = NonNullable<
  Parameters<typeof prisma.changeLogEntry.findMany>[0]
>["where"];

function summarizeNote(note: { body: string; kind: string }) {
  const preview = note.body.length > 80 ? `${note.body.slice(0, 80)}...` : note.body;
  return preview;
}

const IDEA_CONVERTED_SUMMARY = "Idea scheduled as an event.";
const MEMORY_PHOTO_ADDED_SUMMARY = "Photo added to memory.";

const CHANGELOG_EXCLUDED_SUMMARIES = [
  "Comment added to event.",
  "Comment added to idea.",
] as const;

function getActivityChangeLogWhere(spaceId: string): ChangeLogFilters {
  return {
    coupleSpaceId: spaceId,
    entityType: {
      not: "NOTE",
    },
    NOT: {
      AND: [
        {
          changeType: "UPDATE",
        },
        {
          summary: {
            in: [...CHANGELOG_EXCLUDED_SUMMARIES],
          },
        },
      ],
    },
  };
}

export async function countActivityForSpace(spaceId: string): Promise<number> {
  const [noteCount, changeLogCount] = await Promise.all([
    prisma.note.count({
      where: { coupleSpaceId: spaceId },
    }),
    prisma.changeLogEntry.count({
      where: getActivityChangeLogWhere(spaceId),
    }),
  ]);

  return noteCount + changeLogCount;
}

export async function listActivityForSpace(
  spaceId: string,
  options: ActivityQueryOptions = {},
): Promise<ActivityEntry[]> {
  const skip = Math.max(options.skip ?? 0, 0);
  const take = Math.max(options.take ?? 50, 1);
  const candidateTake = skip + take;

  const [notes, changeLogs] = await Promise.all([
    prisma.note.findMany({
      where: { coupleSpaceId: spaceId },
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take: candidateTake,
    }),
    prisma.changeLogEntry.findMany({
      where: getActivityChangeLogWhere(spaceId),
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: candidateTake,
    }),
  ]);

  const eventIds = new Set<string>();
  const ideaIds = new Set<string>();

  for (const entry of changeLogs) {
    if (entry.entityType === "EVENT") {
      eventIds.add(entry.entityId);
    }
    if (entry.entityType === "IDEA") {
      ideaIds.add(entry.entityId);
    }
  }

  for (const note of notes) {
    if (note.parentType === "EVENT" && note.parentId) {
      eventIds.add(note.parentId);
    }
    if (note.parentType === "IDEA" && note.parentId) {
      ideaIds.add(note.parentId);
    }
  }

  const [events, ideas] = await Promise.all([
    eventIds.size > 0
      ? prisma.event.findMany({
          where: { id: { in: [...eventIds] } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    ideaIds.size > 0
      ? prisma.idea.findMany({
          where: { id: { in: [...ideaIds] } },
          select: { id: true, title: true, convertedToEventId: true },
        })
      : Promise.resolve([]),
  ]);

  const convertedEventIds = ideas
    .map((idea) => idea.convertedToEventId)
    .filter((eventId): eventId is string => Boolean(eventId));

  const convertedEvents =
    convertedEventIds.length > 0
      ? await prisma.event.findMany({
          where: { id: { in: convertedEventIds } },
          select: { id: true, title: true },
        })
      : [];

  const eventTitleById = new Map(
    [...events, ...convertedEvents].map((event) => [event.id, event.title]),
  );
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea]));

  const logEntries: ActivityEntry[] = changeLogs.map((entry) => {
    const linkedIdea = entry.entityType === "IDEA" ? ideaById.get(entry.entityId) : null;
    const linkedEventId =
      entry.summary === IDEA_CONVERTED_SUMMARY
        ? linkedIdea?.convertedToEventId ?? null
        : entry.entityType === "EVENT"
          ? entry.entityId
          : null;
    const defaultEntityTitle =
      entry.entityType === "EVENT"
        ? eventTitleById.get(entry.entityId)
        : linkedIdea?.title;
    const entityTitle =
      linkedEventId && eventTitleById.get(linkedEventId)
        ? eventTitleById.get(linkedEventId)
        : defaultEntityTitle;
    const entityHref =
      linkedEventId
        ? `/events/${linkedEventId}`
        : entry.entityType === "IDEA"
          ? `/spaces/${spaceId}/calendar#idea-${entry.entityId}`
          : null;
    const action =
      entry.summary === IDEA_CONVERTED_SUMMARY
        ? "Moved from idea to event"
        : entry.summary === MEMORY_PHOTO_ADDED_SUMMARY
          ? "Photo uploaded"
          : entry.entityType === "EVENT"
            ? entry.changeType === "CREATE"
              ? "Event created"
              : entry.changeType === "UPDATE"
                ? "Event updated"
                : "Event deleted"
            : entry.changeType === "CREATE"
              ? "Idea created"
              : entry.changeType === "UPDATE"
                ? "Idea updated"
                : "Idea deleted";
    const entityType =
      entry.summary === IDEA_CONVERTED_SUMMARY ? "EVENT" : entry.entityType;
    return {
      id: `log-${entry.id}`,
      createdAt: entry.createdAt,
      action,
      entityType,
      entityId: entry.entityId,
      entityTitle: entityTitle ?? null,
      entityHref: entityTitle ? entityHref : null,
      details: null,
      user: entry.user,
    };
  });

  const noteEntries: ActivityEntry[] = notes.map((note) => {
    const isComment =
      note.kind === "EVENT_COMMENT" || note.kind === "IDEA_COMMENT";
    const parentTitle =
      note.parentType === "EVENT"
        ? eventTitleById.get(note.parentId ?? "")
        : note.parentType === "IDEA"
          ? ideaById.get(note.parentId ?? "")?.title
          : null;
    const parentHref =
      note.parentType === "EVENT" && note.parentId
        ? `/events/${note.parentId}`
        : note.parentType === "IDEA" && note.parentId
          ? `/spaces/${spaceId}/calendar#idea-${note.parentId}`
          : null;
    return {
      id: `note-${note.id}`,
      createdAt: note.createdAt,
      action: isComment ? "Comment added" : "Note added",
      entityType: isComment ? "COMMENT" : "NOTE",
      entityId: note.parentId ?? null,
      entityTitle: isComment ? parentTitle ?? null : null,
      entityHref: isComment && parentTitle ? parentHref : null,
      details: isComment ? note.body : summarizeNote(note),
      user: note.author,
    };
  });

  const combined = [...logEntries, ...noteEntries];
  combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return combined.slice(skip, skip + take);
}
