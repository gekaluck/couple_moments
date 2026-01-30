import { prisma } from "@/lib/prisma";
import { getCoupleSpaceForUser } from "@/lib/couple-spaces";

export async function listAvailabilityBlocks(params: {
  spaceId: string;
  from: Date;
  to: Date;
}) {
  const { spaceId, from, to } = params;
  return prisma.availabilityBlock.findMany({
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
  return prisma.availabilityBlock.update({
    where: { id: blockId, createdByUserId: userId },
    data: {
      title: input.title.trim(),
      note: input.note?.trim() || null,
      startAt: input.startAt,
      endAt: input.endAt,
    },
  });
}
