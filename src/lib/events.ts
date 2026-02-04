import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createChangeLogEntry } from "@/lib/change-log";
import { createNoteForSpace } from "@/lib/notes";
import { serializeTags } from "@/lib/tags";
import { getCoupleSpaceForUser } from "@/lib/couple-spaces";

type EventInput = {
  title: string;
  description?: string | null;
  dateTimeStart: Date;
  dateTimeEnd?: Date | null;
  timeIsSet?: boolean;
  tags: string[];
  linkedIdeaId?: string | null;
  placeId?: string | null;
  placeName?: string | null;
  placeAddress?: string | null;
  placeLat?: number | null;
  placeLng?: number | null;
  placeUrl?: string | null;
  placeWebsite?: string | null;
  placeOpeningHours?: string[] | null;
  placePhotoUrls?: string[] | null;
};

export async function listEventsForSpace(params: {
  spaceId: string;
  from?: Date | null;
  to?: Date | null;
  timeframe?: "past" | "upcoming" | "all" | null;
  referenceDate?: Date;
  includePhotos?: boolean;
}) {
  const { spaceId, from, to, timeframe, referenceDate, includePhotos } = params;
  const now = referenceDate ?? new Date();
  const filters: Record<string, unknown>[] = [{ coupleSpaceId: spaceId }];

  if (from || to) {
    filters.push({
      dateTimeStart: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    });
  }

  if (timeframe === "past") {
    filters.push({
      OR: [
        { dateTimeEnd: { lt: now } },
        { dateTimeEnd: null, dateTimeStart: { lt: now } },
      ],
    });
  }

  if (timeframe === "upcoming") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filters.push({
      OR: [
        { dateTimeEnd: { gte: now } },
        { dateTimeEnd: null, dateTimeStart: { gte: now } },
        { timeIsSet: false, dateTimeStart: { gte: startOfToday } },
      ],
    });
  }

  return prisma.event.findMany({
    where: {
      AND: filters,
    },
    include: {
      createdBy: true,
      ...(includePhotos ? { photos: true } : {}),
    },
    orderBy: {
      dateTimeStart: "asc",
    },
  });
}

export async function getEventForUser(eventId: string, userId: string) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      coupleSpace: {
        memberships: {
          some: { userId },
        },
      },
    },
  });
}

export async function createEventForSpace(
  spaceId: string,
  userId: string,
  input: EventInput,
) {
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) throw new Error("Not authorized");

  const event = await prisma.event.create({
    data: {
      coupleSpaceId: spaceId,
      createdByUserId: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type:
        (input.dateTimeEnd ?? input.dateTimeStart) < new Date()
          ? "MEMORY"
          : "PLANNED",
      dateTimeStart: input.dateTimeStart,
      dateTimeEnd: input.dateTimeEnd || null,
      timeIsSet: input.timeIsSet ?? true,
      tags: serializeTags(input.tags),
      originIdeaId: input.linkedIdeaId ?? null,
      placeId: input.placeId ?? null,
      placeName: input.placeName ?? null,
      placeAddress: input.placeAddress ?? null,
      placeLat: input.placeLat ?? null,
      placeLng: input.placeLng ?? null,
      placeUrl: input.placeUrl ?? null,
      placeWebsite: input.placeWebsite ?? null,
      placeOpeningHours: input.placeOpeningHours ?? Prisma.JsonNull,
      placePhotoUrls: input.placePhotoUrls ?? Prisma.JsonNull,
    },
  });

  if (input.linkedIdeaId) {
    const idea = await prisma.idea.findFirst({
      where: {
        id: input.linkedIdeaId,
        coupleSpaceId: spaceId,
      },
    });

    if (idea) {
      await prisma.idea.update({
        where: { id: input.linkedIdeaId },
        data: {
          status: "PLANNED",
          convertedToEventId: event.id,
        },
      });

      await prisma.note.updateMany({
        where: {
          parentType: "IDEA",
          parentId: idea.id,
        },
        data: {
          parentType: "EVENT",
          parentId: event.id,
          kind: "EVENT_COMMENT",
        },
      });

      await createChangeLogEntry({
        coupleSpaceId: spaceId,
        entityType: "IDEA",
        entityId: input.linkedIdeaId,
        userId,
        changeType: "UPDATE",
        summary: "Idea scheduled as an event.",
      });
    }
  }

  await createChangeLogEntry({
    coupleSpaceId: spaceId,
    entityType: "EVENT",
    entityId: event.id,
    userId,
    changeType: "CREATE",
    summary: "Event created.",
  });

  return event;
}

export async function updateEvent(
  eventId: string,
  userId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    dateTimeStart: Date;
    dateTimeEnd: Date | null;
    timeIsSet: boolean;
    tags: string[];
    placeId: string | null;
    placeName: string | null;
    placeAddress: string | null;
    placeLat: number | null;
    placeLng: number | null;
    placeUrl: string | null;
    placeWebsite: string | null;
    placeOpeningHours: string[] | null;
    placePhotoUrls: string[] | null;
  }>,
) {
  const existing = await prisma.event.findFirst({
    where: {
      id: eventId,
      coupleSpace: { memberships: { some: { userId } } },
    },
  });
  if (!existing) throw new Error("Event not found");

  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) {
    data.title = updates.title.trim();
  }
  if (updates.description !== undefined) {
    data.description = updates.description?.trim() || null;
  }
  if (updates.dateTimeStart !== undefined) {
    data.dateTimeStart = updates.dateTimeStart;
  }
  if (updates.dateTimeEnd !== undefined) {
    data.dateTimeEnd = updates.dateTimeEnd;
  }
  if (updates.timeIsSet !== undefined) {
    data.timeIsSet = updates.timeIsSet;
  }
  if (updates.tags !== undefined) {
    data.tags = serializeTags(updates.tags);
  }
  if (updates.placeId !== undefined) {
    data.placeId = updates.placeId ?? null;
  }
  if (updates.placeName !== undefined) {
    data.placeName = updates.placeName ?? null;
  }
  if (updates.placeAddress !== undefined) {
    data.placeAddress = updates.placeAddress ?? null;
  }
  if (updates.placeLat !== undefined) {
    data.placeLat = updates.placeLat ?? null;
  }
  if (updates.placeLng !== undefined) {
    data.placeLng = updates.placeLng ?? null;
  }
  if (updates.placeUrl !== undefined) {
    data.placeUrl = updates.placeUrl ?? null;
  }
  if (updates.placeWebsite !== undefined) {
    data.placeWebsite = updates.placeWebsite ?? null;
  }
  if (updates.placeOpeningHours !== undefined) {
    data.placeOpeningHours = updates.placeOpeningHours ?? null;
  }
  if (updates.placePhotoUrls !== undefined) {
    data.placePhotoUrls = updates.placePhotoUrls ?? null;
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data,
  });

  await createChangeLogEntry({
    coupleSpaceId: event.coupleSpaceId,
    entityType: "EVENT",
    entityId: event.id,
    userId,
    changeType: "UPDATE",
    summary: "Event updated.",
  });

  return event;
}

export async function deleteEvent(eventId: string, userId: string) {
  const existing = await prisma.event.findFirst({
    where: {
      id: eventId,
      coupleSpace: { memberships: { some: { userId } } },
    },
    select: {
      id: true,
      originIdeaId: true,
      coupleSpaceId: true,
    },
  });
  if (!existing) throw new Error("Event not found");

  // Delete associated comments first
  await prisma.note.deleteMany({
    where: {
      parentType: "EVENT",
      parentId: eventId,
    },
  });

  // If this event was created from an idea, revert the idea to NEW status
  if (existing.originIdeaId) {
    try {
      const idea = await prisma.idea.findUnique({
        where: { id: existing.originIdeaId },
      });

      if (idea) {
        await prisma.idea.update({
          where: { id: existing.originIdeaId },
          data: {
            convertedToEventId: null,
            status: "NEW",
          },
        });

        await createChangeLogEntry({
          coupleSpaceId: existing.coupleSpaceId,
          entityType: "IDEA",
          entityId: existing.originIdeaId,
          userId,
          changeType: "UPDATE",
          summary: "Idea restored (event deleted).",
        });
      }
    } catch (error) {
      // If idea doesn't exist or update fails, continue with event deletion
      console.error("Failed to revert idea:", error);
    }
  }

  const event = await prisma.event.delete({
    where: { id: eventId },
  });

  await createChangeLogEntry({
    coupleSpaceId: event.coupleSpaceId,
    entityType: "EVENT",
    entityId: event.id,
    userId,
    changeType: "DELETE",
    summary: "Event deleted.",
  });

  return event;
}

export async function createEventPhoto(
  eventId: string,
  userId: string,
  storageUrl: string,
) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      coupleSpace: {
        memberships: {
          some: { userId },
        },
      },
    },
  });
  if (!event) {
    throw new Error("Event not found");
  }
  return prisma.photo.create({
    data: {
      eventId,
      uploadedByUserId: userId,
      storageUrl,
    },
  });
}

export async function listEventComments(eventId: string) {
  return prisma.note.findMany({
    where: {
      parentType: "EVENT",
      parentId: eventId,
      kind: "EVENT_COMMENT",
    },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function listEventCommentsForEvents(eventIds: string[]) {
  if (eventIds.length === 0) {
    return [];
  }
  return prisma.note.findMany({
    where: {
      parentType: "EVENT",
      parentId: { in: eventIds },
      kind: "EVENT_COMMENT",
    },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createEventComment(
  eventId: string,
  userId: string,
  content: string,
) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      coupleSpace: { memberships: { some: { userId } } },
    },
  });
  if (!event) {
    return null;
  }

  await createNoteForSpace({
    spaceId: event.coupleSpaceId,
    userId,
    body: content,
    kind: "EVENT_COMMENT",
    parentType: "EVENT",
    parentId: eventId,
  });

  await createChangeLogEntry({
    coupleSpaceId: event.coupleSpaceId,
    entityType: "EVENT",
    entityId: eventId,
    userId,
    changeType: "UPDATE",
    summary: "Comment added to event.",
  });

  return true;
}

export async function listEventReactions(eventId: string) {
  return prisma.reaction.findMany({
    where: {
      targetType: "EVENT",
      targetId: eventId,
    },
  });
}

export async function toggleEventReaction(
  eventId: string,
  userId: string,
  emoji: string,
) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      coupleSpace: { memberships: { some: { userId } } },
    },
  });
  if (!event) throw new Error("Event not found");

  const existing = await prisma.reaction.findFirst({
    where: {
      targetType: "EVENT",
      targetId: eventId,
      userId,
      emoji,
    },
  });

  if (existing) {
    await prisma.reaction.delete({
      where: { id: existing.id },
    });
    return { removed: true };
  }

  await prisma.reaction.create({
    data: {
      targetType: "EVENT",
      targetId: eventId,
      userId,
      emoji,
    },
  });

  return { removed: false };
}

export async function updateEventRating(
  eventId: string,
  userId: string,
  rating: number,
) {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      coupleSpace: {
        include: { memberships: true },
      },
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  const isMember = event.coupleSpace.memberships.some(
    (m) => m.userId === userId,
  );
  if (!isMember) {
    throw new Error("Not authorized");
  }

  await prisma.rating.upsert({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
    create: {
      userId,
      eventId,
      value: rating,
    },
    update: {
      value: rating,
    },
  });

  await createChangeLogEntry({
    coupleSpaceId: event.coupleSpaceId,
    entityType: "EVENT",
    entityId: eventId,
    userId,
    changeType: "UPDATE",
    summary: `Rated memory ${rating}/5 hearts.`,
  });
}
