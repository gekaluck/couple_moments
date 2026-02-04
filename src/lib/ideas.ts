import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createChangeLogEntry } from "@/lib/change-log";
import { createNoteForSpace } from "@/lib/notes";
import { serializeTags } from "@/lib/tags";
import { getCoupleSpaceForUser } from "@/lib/couple-spaces";

type IdeaStatus = "NEW" | "PLANNED" | "DONE";

type IdeaInput = {
  title: string;
  description?: string | null;
  tags: string[];
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

export async function listIdeasForSpace(params: {
  spaceId: string;
  status?: IdeaStatus | null;
}) {
  const { spaceId, status } = params;
  return prisma.idea.findMany({
    where: {
      coupleSpaceId: spaceId,
      convertedToEventId: null,
      ...(status ? { status } : {}),
    },
    include: {
      createdBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getIdeaForUser(ideaId: string, userId: string) {
  return prisma.idea.findFirst({
    where: {
      id: ideaId,
      coupleSpace: {
        memberships: {
          some: { userId },
        },
      },
    },
  });
}

export async function createIdeaForSpace(
  spaceId: string,
  userId: string,
  input: IdeaInput,
) {
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) throw new Error("Not authorized");

  const idea = await prisma.idea.create({
    data: {
      coupleSpaceId: spaceId,
      createdByUserId: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      tags: serializeTags(input.tags),
      placeId: input.placeId ?? null,
      placeName: input.placeName ?? null,
      placeAddress: input.placeAddress ?? null,
      placeLat: input.placeLat ?? null,
      placeLng: input.placeLng ?? null,
      placeUrl: input.placeUrl ?? null,
      placeWebsite: input.placeWebsite ?? null,
      placeOpeningHours: input.placeOpeningHours ?? Prisma.JsonNull,
      placePhotoUrls: input.placePhotoUrls ?? Prisma.JsonNull,
      status: "NEW",
    },
  });

  await createChangeLogEntry({
    coupleSpaceId: spaceId,
    entityType: "IDEA",
    entityId: idea.id,
    userId,
    changeType: "CREATE",
    summary: "Idea created.",
  });

  return idea;
}

export async function updateIdea(
  ideaId: string,
  userId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    status: IdeaStatus;
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
  const existing = await prisma.idea.findFirst({
    where: {
      id: ideaId,
      coupleSpace: { memberships: { some: { userId } } },
    },
  });
  if (!existing) throw new Error("Idea not found");

  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) {
    data.title = updates.title.trim();
  }
  if (updates.description !== undefined) {
    data.description = updates.description?.trim() || null;
  }
  if (updates.status !== undefined) {
    data.status = updates.status;
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
    data.placeOpeningHours = updates.placeOpeningHours ?? Prisma.JsonNull;
  }
  if (updates.placePhotoUrls !== undefined) {
    data.placePhotoUrls = updates.placePhotoUrls ?? Prisma.JsonNull;
  }

  const idea = await prisma.idea.update({
    where: { id: ideaId },
    data,
  });

  await createChangeLogEntry({
    coupleSpaceId: idea.coupleSpaceId,
    entityType: "IDEA",
    entityId: idea.id,
    userId,
    changeType: "UPDATE",
    summary: "Idea updated.",
  });

  return idea;
}

export async function deleteIdea(ideaId: string, userId: string) {
  const existing = await prisma.idea.findFirst({
    where: {
      id: ideaId,
      coupleSpace: {
        memberships: {
          some: { userId }
        }
      }
    },
  });

  if (!existing) {
    throw new Error("Idea not found or you do not have permission to delete it.");
  }

  // Delete associated comments first
  await prisma.note.deleteMany({
    where: {
      parentType: "IDEA",
      parentId: ideaId,
    },
  });

  const idea = await prisma.idea.delete({
    where: { id: ideaId },
  });

  await createChangeLogEntry({
    coupleSpaceId: idea.coupleSpaceId,
    entityType: "IDEA",
    entityId: idea.id,
    userId,
    changeType: "DELETE",
    summary: "Idea deleted.",
  });

  return idea;
}

export async function listIdeaComments(ideaId: string) {
  return prisma.note.findMany({
    where: {
      parentType: "IDEA",
      parentId: ideaId,
      kind: "IDEA_COMMENT",
    },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function listIdeaCommentsForIdeas(ideaIds: string[]) {
  if (ideaIds.length === 0) {
    return [];
  }
  return prisma.note.findMany({
    where: {
      parentType: "IDEA",
      parentId: { in: ideaIds },
      kind: "IDEA_COMMENT",
    },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createIdeaComment(
  ideaId: string,
  userId: string,
  content: string,
) {
  const idea = await prisma.idea.findFirst({
    where: {
      id: ideaId,
      coupleSpace: { memberships: { some: { userId } } },
    },
  });
  if (!idea) {
    return null;
  }

  await createNoteForSpace({
    spaceId: idea.coupleSpaceId,
    userId,
    body: content,
    kind: "IDEA_COMMENT",
    parentType: "IDEA",
    parentId: ideaId,
  });

  await createChangeLogEntry({
    coupleSpaceId: idea.coupleSpaceId,
    entityType: "IDEA",
    entityId: ideaId,
    userId,
    changeType: "UPDATE",
    summary: "Comment added to idea.",
  });

  return true;
}
