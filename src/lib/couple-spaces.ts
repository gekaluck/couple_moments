import crypto from "crypto";

import { prisma } from "@/lib/prisma";

const MAX_MEMBERS_PER_SPACE = 2;
const INVITE_CODE_BYTES = 6;
const INVITE_ATTEMPTS = 5;

function createInviteCode() {
  return crypto.randomBytes(INVITE_CODE_BYTES).toString("base64url");
}

export async function listCoupleSpacesForUser(userId: string) {
  return prisma.coupleSpace.findMany({
    where: {
      memberships: {
        some: { userId },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function createCoupleSpaceForUser(
  userId: string,
  name: string | null,
) {
  for (let attempt = 0; attempt < INVITE_ATTEMPTS; attempt += 1) {
    const inviteCode = createInviteCode();
    try {
      return await prisma.coupleSpace.create({
        data: {
          name: name?.trim() || null,
          inviteCode,
          memberships: {
            create: {
              userId,
              role: "member",
            },
          },
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate a unique invite code.");
}

export async function getCoupleSpaceForUser(spaceId: string, userId: string) {
  return prisma.coupleSpace.findFirst({
    where: {
      id: spaceId,
      memberships: {
        some: { userId },
      },
    },
  });
}

export async function listSpaceMembers(spaceId: string) {
  return prisma.membership.findMany({
    where: { coupleSpaceId: spaceId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function joinCoupleSpaceByInvite(
  inviteCode: string,
  userId: string,
) {
  const space = await prisma.coupleSpace.findUnique({
    where: { inviteCode },
    include: {
      memberships: true,
    },
  });

  if (!space) {
    return { space: null, error: "Invite code not found." };
  }

  const alreadyMember = space.memberships.some(
    (membership) => membership.userId === userId,
  );
  if (alreadyMember) {
    return { space, error: null };
  }

  if (space.memberships.length >= MAX_MEMBERS_PER_SPACE) {
    return { space: null, error: "This space is already full." };
  }

  await prisma.membership.create({
    data: {
      userId,
      coupleSpaceId: space.id,
      role: "member",
    },
  });

  return { space, error: null };
}
