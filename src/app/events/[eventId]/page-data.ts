import { getEventForUser, listEventComments } from "@/lib/events";
import { listSpaceMembers } from "@/lib/couple-spaces";
import { buildCreatorVisuals } from "@/lib/creator-colors";
import { getEventSyncStatus } from "@/lib/integrations/google/events";
import { prisma } from "@/lib/prisma";

export async function loadEventBaseData(eventId: string, userId: string) {
  return Promise.all([
    getEventForUser(eventId, userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
  ]);
}

export async function loadEventDetailData(params: {
  eventId: string;
  userId: string;
  coupleSpaceId: string;
  createdByUserId: string;
}) {
  const { eventId, userId, coupleSpaceId, createdByUserId } = params;

  const [currentUserRating, allRatings, photos, comments, creator, googleSyncStatus, members] =
    await Promise.all([
      prisma.rating.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        select: { value: true },
      }),
      prisma.rating.findMany({
        where: { eventId },
        select: { userId: true, value: true },
      }),
      prisma.photo.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
      }),
      listEventComments(eventId),
      prisma.user.findUnique({
        where: { id: createdByUserId },
        select: { name: true, email: true },
      }),
      getEventSyncStatus(eventId),
      listSpaceMembers(coupleSpaceId),
    ]);
  const memberVisuals = buildCreatorVisuals(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      alias: member.alias,
      initials: member.initials,
      color: member.color,
    })),
  );

  return {
    currentUserRating,
    allRatings,
    photos,
    comments,
    creator,
    googleSyncStatus,
    members,
    memberVisuals,
  };
}
