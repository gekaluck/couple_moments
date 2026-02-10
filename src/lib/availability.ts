import { prisma } from "@/lib/prisma";
import { getCoupleSpaceForUser, listSpaceMembers } from "@/lib/couple-spaces";

export async function listAvailabilityBlocks(params: {
  spaceId: string;
  from: Date;
  to: Date;
}) {
  const { spaceId, from, to } = params;
  
  // Get manual availability blocks
  const manualBlocks = await prisma.availabilityBlock.findMany({
    where: {
      coupleSpaceId: spaceId,
      startAt: { lte: to },
      endAt: { gte: from },
    },
    include: {
      createdBy: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });
  
  // Get space members to fetch their external blocks
  const members = await listSpaceMembers(spaceId);
  const memberUserIds = members.map((m) => m.userId);
  
  // Get external availability blocks for all members
  const externalBlocks = await prisma.externalAvailabilityBlock.findMany({
    where: {
      userId: { in: memberUserIds },
      startAt: { lte: to },
      endAt: { gte: from },
    },
    include: {
      user: true,
      externalAccount: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });
  
  // Return both types of blocks
  return {
    manual: manualBlocks,
    external: externalBlocks,
  };
}

export async function createAvailabilityBlock(
  spaceId: string,
  userId: string,
  input: {
    title: string;
    note?: string | null;
    startAt: Date;
    endAt: Date;
  },
) {
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) throw new Error("Not authorized");

  return prisma.availabilityBlock.create({
    data: {
      coupleSpaceId: spaceId,
      createdByUserId: userId,
      title: input.title.trim(),
      note: input.note?.trim() || null,
      startAt: input.startAt,
      endAt: input.endAt,
    },
  });
}

export async function updateAvailabilityBlock(
  blockId: string,
  userId: string,
  input: {
    title: string;
    note?: string | null;
    startAt: Date;
    endAt: Date;
  },
) {
  const existing = await prisma.availabilityBlock.findFirst({
    where: {
      id: blockId,
      createdByUserId: userId,
    },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Not authorized");
  }

  return prisma.availabilityBlock.update({
    where: { id: blockId },
    data: {
      title: input.title.trim(),
      note: input.note?.trim() || null,
      startAt: input.startAt,
      endAt: input.endAt,
    },
  });
}
