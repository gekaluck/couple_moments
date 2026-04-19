import { prisma } from "@/lib/prisma";

export type ActivityType =
  | "event_created"
  | "event_updated"
  | "idea_saved"
  | "idea_promoted"
  | "comment_added"
  | "memory_completed"
  | "photo_added";

export type ActivityTarget = {
  kind: "event" | "idea" | "memory";
  id: string;
  title: string;
  href: string;
};

export type ActivityMemory = {
  rating: number;
  photoCount: number;
  heroPhotoUrl: string | null;
};

export type ActivityPhoto = {
  url: string;
  alt?: string | null;
};

export type ActivityItem = {
  id: string;
  type: ActivityType;
  createdAt: Date;
  actorId: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
  };
  target: ActivityTarget | null;
  body: string | null;
  memory: ActivityMemory | null;
  photos: ActivityPhoto[] | null;
  relatedIdea: { title: string } | null;
};

type ActivityQueryOptions = {
  skip?: number;
  take?: number;
};

type ChangeLogFilters = NonNullable<
  Parameters<typeof prisma.changeLogEntry.findMany>[0]
>["where"];

const IDEA_CONVERTED_SUMMARY = "Idea scheduled as an event.";
const MEMORY_PHOTO_ADDED_SUMMARY = "Photo added to memory.";

const CHANGELOG_EXCLUDED_SUMMARIES = [
  "Comment added to event.",
  "Comment added to idea.",
  "Photo removed from memory.",
  "Memory thumbnail updated.",
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
  const [commentCount, changeLogCount, ratingCount] = await Promise.all([
    prisma.note.count({
      where: {
        coupleSpaceId: spaceId,
        kind: { in: ["EVENT_COMMENT", "IDEA_COMMENT"] },
      },
    }),
    prisma.changeLogEntry.count({
      where: getActivityChangeLogWhere(spaceId),
    }),
    prisma.rating.count({
      where: {
        event: { coupleSpaceId: spaceId },
      },
    }),
  ]);

  return commentCount + changeLogCount + ratingCount;
}

export async function listActivityForSpace(
  spaceId: string,
  options: ActivityQueryOptions = {},
): Promise<ActivityItem[]> {
  const skip = Math.max(options.skip ?? 0, 0);
  const take = Math.max(options.take ?? 50, 1);
  const candidateTake = skip + take;

  const [comments, changeLogs, ratings] = await Promise.all([
    prisma.note.findMany({
      where: {
        coupleSpaceId: spaceId,
        kind: { in: ["EVENT_COMMENT", "IDEA_COMMENT"] },
      },
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
    prisma.rating.findMany({
      where: {
        event: { coupleSpaceId: spaceId },
      },
      include: {
        user: true,
        event: {
          select: {
            id: true,
            title: true,
            photos: {
              orderBy: [{ isCover: "desc" }, { createdAt: "asc" }],
              take: 1,
              select: { storageUrl: true },
            },
            _count: { select: { photos: true } },
          },
        },
      },
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

  for (const comment of comments) {
    if (comment.parentType === "EVENT" && comment.parentId) {
      eventIds.add(comment.parentId);
    }
    if (comment.parentType === "IDEA" && comment.parentId) {
      ideaIds.add(comment.parentId);
    }
  }

  const photoLinkedEventIds = changeLogs
    .filter(
      (entry) =>
        entry.entityType === "EVENT" &&
        entry.summary === MEMORY_PHOTO_ADDED_SUMMARY,
    )
    .map((entry) => entry.entityId);

  const [events, ideas, photoEventCovers] = await Promise.all([
    eventIds.size > 0
      ? prisma.event.findMany({
          where: { id: { in: [...eventIds] } },
          select: { id: true, title: true },
        })
      : Promise.resolve([] as { id: string; title: string }[]),
    ideaIds.size > 0
      ? prisma.idea.findMany({
          where: { id: { in: [...ideaIds] } },
          select: { id: true, title: true, convertedToEventId: true },
        })
      : Promise.resolve(
          [] as {
            id: string;
            title: string;
            convertedToEventId: string | null;
          }[],
        ),
    photoLinkedEventIds.length > 0
      ? prisma.photo.findMany({
          where: { eventId: { in: photoLinkedEventIds } },
          orderBy: [{ isCover: "desc" }, { createdAt: "asc" }],
          select: { eventId: true, storageUrl: true },
        })
      : Promise.resolve([] as { eventId: string; storageUrl: string }[]),
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
  const photoCoverByEventId = new Map<string, string>();
  for (const cover of photoEventCovers) {
    if (!photoCoverByEventId.has(cover.eventId)) {
      photoCoverByEventId.set(cover.eventId, cover.storageUrl);
    }
  }

  const logItems: ActivityItem[] = [];
  for (const entry of changeLogs) {
    const linkedIdea =
      entry.entityType === "IDEA" ? ideaById.get(entry.entityId) ?? null : null;

    if (entry.summary === IDEA_CONVERTED_SUMMARY) {
      const convertedEventId = linkedIdea?.convertedToEventId ?? null;
      const targetTitle =
        (convertedEventId ? eventTitleById.get(convertedEventId) : null) ??
        linkedIdea?.title ??
        null;
      if (!convertedEventId || !targetTitle) {
        continue;
      }
      logItems.push({
        id: `log-${entry.id}`,
        type: "idea_promoted",
        createdAt: entry.createdAt,
        actorId: entry.userId,
        actor: entry.user,
        target: {
          kind: "event",
          id: convertedEventId,
          title: targetTitle,
          href: `/events/${convertedEventId}`,
        },
        body: null,
        memory: null,
        photos: null,
        relatedIdea: linkedIdea ? { title: linkedIdea.title } : null,
      });
      continue;
    }

    if (
      entry.entityType === "EVENT" &&
      entry.summary === MEMORY_PHOTO_ADDED_SUMMARY
    ) {
      const eventTitle = eventTitleById.get(entry.entityId);
      if (!eventTitle) {
        continue;
      }
      const cover = photoCoverByEventId.get(entry.entityId) ?? null;
      logItems.push({
        id: `log-${entry.id}`,
        type: "photo_added",
        createdAt: entry.createdAt,
        actorId: entry.userId,
        actor: entry.user,
        target: {
          kind: "event",
          id: entry.entityId,
          title: eventTitle,
          href: `/events/${entry.entityId}`,
        },
        body: null,
        memory: null,
        photos: cover ? [{ url: cover }] : null,
        relatedIdea: null,
      });
      continue;
    }

    if (entry.entityType === "EVENT") {
      const eventTitle = eventTitleById.get(entry.entityId);
      if (!eventTitle || entry.changeType === "DELETE") {
        continue;
      }
      logItems.push({
        id: `log-${entry.id}`,
        type: entry.changeType === "CREATE" ? "event_created" : "event_updated",
        createdAt: entry.createdAt,
        actorId: entry.userId,
        actor: entry.user,
        target: {
          kind: "event",
          id: entry.entityId,
          title: eventTitle,
          href: `/events/${entry.entityId}`,
        },
        body: null,
        memory: null,
        photos: null,
        relatedIdea: null,
      });
      continue;
    }

    if (entry.entityType === "IDEA") {
      if (entry.changeType !== "CREATE" || !linkedIdea) {
        continue;
      }
      logItems.push({
        id: `log-${entry.id}`,
        type: "idea_saved",
        createdAt: entry.createdAt,
        actorId: entry.userId,
        actor: entry.user,
        target: {
          kind: "idea",
          id: entry.entityId,
          title: linkedIdea.title,
          href: `/spaces/${spaceId}/calendar#idea-${entry.entityId}`,
        },
        body: null,
        memory: null,
        photos: null,
        relatedIdea: null,
      });
    }
  }

  const commentItems: ActivityItem[] = [];
  for (const comment of comments) {
    if (!comment.parentId) {
      continue;
    }
    const targetTitle =
      comment.parentType === "EVENT"
        ? eventTitleById.get(comment.parentId) ?? null
        : comment.parentType === "IDEA"
          ? ideaById.get(comment.parentId)?.title ?? null
          : null;
    if (!targetTitle) {
      continue;
    }
    const href =
      comment.parentType === "EVENT"
        ? `/events/${comment.parentId}`
        : `/spaces/${spaceId}/calendar#idea-${comment.parentId}`;

    commentItems.push({
      id: `note-${comment.id}`,
      type: "comment_added",
      createdAt: comment.createdAt,
      actorId: comment.authorUserId,
      actor: comment.author,
      target: {
        kind: comment.parentType === "EVENT" ? "event" : "idea",
        id: comment.parentId,
        title: targetTitle,
        href,
      },
      body: comment.body,
      memory: null,
      photos: null,
      relatedIdea: null,
    });
  }

  const ratingItems: ActivityItem[] = ratings.map((rating) => {
    const heroPhotoUrl = rating.event.photos[0]?.storageUrl ?? null;
    return {
      id: `rating-${rating.id}`,
      type: "memory_completed",
      createdAt: rating.createdAt,
      actorId: rating.userId,
      actor: rating.user,
      target: {
        kind: "memory",
        id: rating.event.id,
        title: rating.event.title,
        href: `/events/${rating.event.id}`,
      },
      body: null,
      memory: {
        rating: rating.value,
        photoCount: rating.event._count.photos,
        heroPhotoUrl,
      },
      photos: null,
      relatedIdea: null,
    };
  });

  const combined = [...logItems, ...commentItems, ...ratingItems];
  combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return combined.slice(skip, skip + take);
}
