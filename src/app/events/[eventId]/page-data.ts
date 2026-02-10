import { getEventForUser, listEventComments } from "@/lib/events";
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

  const [currentUserRating, photos, comments, creator, googleSyncStatus, members] =
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
      prisma.membership.findMany({
        where: { coupleSpaceId },
        select: {
          userId: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

  return {
    currentUserRating,
    photos,
    comments,
    creator,
    googleSyncStatus,
    members,
  };
}
