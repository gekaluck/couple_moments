import crypto from "crypto";

import { prisma } from "@/lib/prisma";

export type SpaceMember = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  coupleSpaceId: string;
  role: string;
  alias?: string | null;
  initials?: string | null;
  color?: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};

type SpaceMemberRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  coupleSpaceId: string;
  role: string;
  alias: string | null;
  initials: string | null;
  color: string | null;
  user_id: string;
  user_name: string | null;
  user_email: string;
};

type SpaceMemberLegacyRow = Omit<SpaceMemberRow, "alias" | "initials" | "color">;

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
  let rows: SpaceMemberRow[];
  try {
    rows = await prisma.$queryRaw<SpaceMemberRow[]>`
      SELECT
        m."id",
        m."createdAt",
        m."updatedAt",
        m."userId",
        m."coupleSpaceId",
        m."role",
        m."alias",
        m."initials",
        m."color",
        u."id" AS "user_id",
        u."name" AS "user_name",
        u."email" AS "user_email"
      FROM "Membership" m
      INNER JOIN "User" u ON u."id" = m."userId"
      WHERE m."coupleSpaceId" = ${spaceId}
      ORDER BY m."createdAt" ASC
    `;
  } catch {
    const legacyRows = await prisma.$queryRaw<SpaceMemberLegacyRow[]>`
      SELECT
        m."id",
        m."createdAt",
        m."updatedAt",
        m."userId",
        m."coupleSpaceId",
        m."role",
        u."id" AS "user_id",
        u."name" AS "user_name",
        u."email" AS "user_email"
      FROM "Membership" m
      INNER JOIN "User" u ON u."id" = m."userId"
      WHERE m."coupleSpaceId" = ${spaceId}
      ORDER BY m."createdAt" ASC
    `;
    rows = legacyRows.map((row) => ({
      ...row,
      alias: null,
      initials: null,
      color: null,
    }));
  }

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    userId: row.userId,
    coupleSpaceId: row.coupleSpaceId,
    role: row.role,
    alias: row.alias,
    initials: row.initials,
    color: row.color,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
    },
  }));
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

export async function updateMembershipAppearance(params: {
  coupleSpaceId: string;
  userId: string;
  alias: string | null;
  initials: string | null;
  color: string | null;
}) {
  const { coupleSpaceId, userId, alias, initials, color } = params;
  const appearanceData = {
    alias,
    initials,
    color,
  } as unknown as Parameters<typeof prisma.membership.updateMany>[0]["data"];
  const result = await prisma.membership.updateMany({
    where: {
      userId,
      coupleSpaceId,
    },
    // TODO: remove cast after running prisma generate in environments
    // where Membership alias/initials/color are present in generated client types.
    data: appearanceData,
  });

  if (result.count === 0) {
    throw new Error("Membership not found.");
  }
}

export async function removePartnerMembership(params: {
  coupleSpaceId: string;
  actorUserId: string;
  targetUserId: string;
}) {
  const { coupleSpaceId, actorUserId, targetUserId } = params;

  if (actorUserId === targetUserId) {
    throw new Error("You cannot remove yourself as partner.");
  }

  return prisma.$transaction(async (tx) => {
    const memberships = await tx.membership.findMany({
      where: { coupleSpaceId },
      select: { id: true, userId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const actorMembership = memberships.find((membership) => membership.userId === actorUserId);
    if (!actorMembership) {
      throw new Error("Not authorized.");
    }

    if (memberships.length < 2) {
      throw new Error("No partner to remove.");
    }

    const creatorUserId = memberships[0]?.userId;
    if (!creatorUserId || creatorUserId !== actorUserId) {
      throw new Error("Only the space creator can remove a partner.");
    }

    const targetMembership = memberships.find((membership) => membership.userId === targetUserId);
    if (!targetMembership) {
      throw new Error("Partner not found.");
    }

    await tx.membership.delete({
      where: { id: targetMembership.id },
    });
  });
}

export async function leaveCoupleSpace(params: {
  coupleSpaceId: string;
  userId: string;
}) {
  const { coupleSpaceId, userId } = params;

  return prisma.$transaction(async (tx) => {
    const memberships = await tx.membership.findMany({
      where: { coupleSpaceId },
      select: { id: true, userId: true },
    });

    const currentMembership = memberships.find((membership) => membership.userId === userId);
    if (!currentMembership) {
      throw new Error("Not authorized.");
    }

    if (memberships.length <= 1) {
      throw new Error("You cannot leave while you are the only member.");
    }

    await tx.membership.delete({
      where: { id: currentMembership.id },
    });
  });
}
