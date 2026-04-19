import type { LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createChangeLogEntry } from "@/lib/change-log";
import { createNoteForSpace } from "@/lib/notes";
import { serializeTags } from "@/lib/tags";
import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { sanitizeHttpUrl } from "@/lib/parsers";
import {
  isCloudinaryAssetUrl,
  isSupportedImagePath,
  MAX_EVENT_PHOTOS,
} from "@/lib/event-photos";

const PHOTO_VALIDATION_TIMEOUT_MS = 5000;

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

  if (to) {
    filters.push({
      dateTimeStart: {
        lte: to,
      },
    });
  }

  if (from) {
    filters.push({
      OR: [
        { dateTimeEnd: { gte: from } },
        { dateTimeEnd: null, dateTimeStart: { gte: from } },
      ],
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
      ...(includePhotos
        ? {
            photos: {
              orderBy: [
                { isCover: "desc" },
                { createdAt: "asc" },
              ],
            },
          }
        : {}),
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
  if (input.dateTimeEnd && input.dateTimeEnd < input.dateTimeStart) {
    throw new Error("End date cannot be before the start date.");
  }

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
      placeUrl: sanitizeHttpUrl(input.placeUrl),
      placeWebsite: sanitizeHttpUrl(input.placeWebsite),
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

  const resolvedStart = updates.dateTimeStart ?? existing.dateTimeStart;
  const resolvedEnd =
    updates.dateTimeEnd === undefined ? existing.dateTimeEnd : updates.dateTimeEnd;

  if (resolvedEnd && resolvedEnd < resolvedStart) {
    throw new Error("End date cannot be before the start date.");
  }

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
  if (
    updates.dateTimeStart !== undefined ||
    updates.dateTimeEnd !== undefined
  ) {
    data.type =
      (resolvedEnd ?? resolvedStart) < new Date()
        ? "MEMORY"
        : "PLANNED";
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
    data.placeUrl = sanitizeHttpUrl(updates.placeUrl);
  }
  if (updates.placeWebsite !== undefined) {
    data.placeWebsite = sanitizeHttpUrl(updates.placeWebsite);
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
  const normalizedUrl = await validateEventPhotoUrl(storageUrl);
  const existingPhotoCount = await prisma.photo.count({
    where: { eventId },
  });
  if (existingPhotoCount >= MAX_EVENT_PHOTOS) {
    throw new Error(`You can add up to ${MAX_EVENT_PHOTOS} photos to one memory.`);
  }
  const photo = await prisma.photo.create({
    data: {
      eventId,
      uploadedByUserId: userId,
      storageUrl: normalizedUrl,
      isCover: existingPhotoCount === 0,
    },
  });

  await createChangeLogEntry({
    coupleSpaceId: event.coupleSpaceId,
    entityType: "EVENT",
    entityId: event.id,
    userId,
    changeType: "UPDATE",
    summary: "Photo added to memory.",
  });

  return photo;
}

export async function deleteEventPhoto(photoId: string, userId: string) {
  const photo = await prisma.photo.findFirst({
    where: {
      id: photoId,
      event: {
        coupleSpace: {
          memberships: {
            some: { userId },
          },
        },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          coupleSpaceId: true,
        },
      },
    },
  });
  if (!photo) {
    throw new Error("Photo not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.photo.delete({
      where: { id: photoId },
    });

    if (photo.isCover) {
      const nextCover = await tx.photo.findFirst({
        where: {
          eventId: photo.event.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (nextCover) {
        await tx.photo.update({
          where: { id: nextCover.id },
          data: { isCover: true },
        });
      }
    }
  });

  await createChangeLogEntry({
    coupleSpaceId: photo.event.coupleSpaceId,
    entityType: "EVENT",
    entityId: photo.event.id,
    userId,
    changeType: "UPDATE",
    summary: "Photo removed from memory.",
  });

  return photo;
}

export async function setEventPhotoAsCover(photoId: string, userId: string) {
  const photo = await prisma.photo.findFirst({
    where: {
      id: photoId,
      event: {
        coupleSpace: {
          memberships: {
            some: { userId },
          },
        },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          coupleSpaceId: true,
        },
      },
    },
  });
  if (!photo) {
    throw new Error("Photo not found.");
  }

  await prisma.$transaction([
    prisma.photo.updateMany({
      where: {
        eventId: photo.event.id,
        isCover: true,
      },
      data: {
        isCover: false,
      },
    }),
    prisma.photo.update({
      where: { id: photo.id },
      data: {
        isCover: true,
      },
    }),
  ]);

  await createChangeLogEntry({
    coupleSpaceId: photo.event.coupleSpaceId,
    entityType: "EVENT",
    entityId: photo.event.id,
    userId,
    changeType: "UPDATE",
    summary: "Memory thumbnail updated.",
  });

  return photo;
}

function ipv4IsPrivate(ip: string) {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local / cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGN 100.64.0.0/10
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

function ipv6IsPrivate(ip: string) {
  const normalized = ip.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  const mapped = normalized.match(/^::ffff:([0-9.]+)$/);
  if (mapped && isIP(mapped[1]) === 4) {
    return ipv4IsPrivate(mapped[1]);
  }
  if (/^f[cd]/.test(normalized)) return true; // ULA fc00::/7
  if (/^fe[89ab]/.test(normalized)) return true; // link-local fe80::/10
  return false;
}

function ipIsPrivate(ip: string, family: number) {
  return family === 6 ? ipv6IsPrivate(ip) : ipv4IsPrivate(ip);
}

async function ensureHostnameIsPublic(hostname: string) {
  if (!hostname) {
    throw new Error("Photo URL must include a host.");
  }
  const literalFamily = isIP(hostname);
  if (literalFamily !== 0) {
    if (ipIsPrivate(hostname, literalFamily)) {
      throw new Error("Photo URL must point to a public host.");
    }
    return;
  }
  let addresses: LookupAddress[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new Error("Photo URL host could not be resolved.");
  }
  if (addresses.length === 0) {
    throw new Error("Photo URL host could not be resolved.");
  }
  for (const { address, family } of addresses) {
    if (ipIsPrivate(address, family)) {
      throw new Error("Photo URL must point to a public host.");
    }
  }
}

async function validateEventPhotoUrl(storageUrl: string) {
  const trimmed = storageUrl.trim();
  if (!trimmed) {
    throw new Error("Photo URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Photo URL must be a valid HTTPS image link.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Photo URL must use HTTPS.");
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || undefined;
  if (isCloudinaryAssetUrl(parsed, cloudName) || isSupportedImagePath(parsed.pathname)) {
    return parsed.toString();
  }

  await ensureHostnameIsPublic(parsed.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PHOTO_VALIDATION_TIMEOUT_MS);
  try {
    const response = await fetch(parsed, {
      method: "HEAD",
      redirect: "error",
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (response.ok && contentType.startsWith("image/")) {
      return parsed.toString();
    }
  } catch {
    // Fall through to a consistent validation error.
  } finally {
    clearTimeout(timeout);
  }

  throw new Error("Photo URL must point to an image.");
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
