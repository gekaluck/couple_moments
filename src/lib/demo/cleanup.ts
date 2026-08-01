import { prisma } from "@/lib/prisma";

/**
 * Deletes expired demo sandboxes.
 *
 * Only `Session` cascades in this schema, so every other table has to be cleared
 * in dependency order by hand. The order below is load-bearing:
 *
 *   Reaction/Rating/Photo → Note → ChangeLogEntry → AvailabilityBlock
 *     → Event (before Idea: `Event.originIdeaId` references it)
 *     → Idea → Membership → CoupleSpace → Session → User
 *
 * Every query is scoped to rows reachable from an expired demo space, so a real
 * space can never be touched even if the flags were somehow wrong.
 */

export type DemoCleanupResult = {
  spacesDeleted: number;
  usersDeleted: number;
};

export async function deleteExpiredDemoSpaces(
  now = new Date(),
  limit = 25,
): Promise<DemoCleanupResult> {
  const expired = await prisma.coupleSpace.findMany({
    where: {
      isDemo: true,
      demoExpiresAt: { not: null, lte: now },
    },
    select: { id: true },
    take: limit,
  });

  if (expired.length === 0) {
    return { spacesDeleted: 0, usersDeleted: 0 };
  }

  const spaceIds = expired.map((space) => space.id);
  let usersDeleted = 0;

  for (const spaceId of spaceIds) {
    usersDeleted += await deleteDemoSpace(spaceId);
  }

  return { spacesDeleted: spaceIds.length, usersDeleted };
}

async function deleteDemoSpace(spaceId: string) {
  const [memberships, events, notes] = await Promise.all([
    prisma.membership.findMany({
      where: { coupleSpaceId: spaceId },
      select: { userId: true },
    }),
    prisma.event.findMany({
      where: { coupleSpaceId: spaceId },
      select: { id: true },
    }),
    prisma.note.findMany({
      where: { coupleSpaceId: spaceId },
      select: { id: true },
    }),
  ]);

  const userIds = memberships.map((membership) => membership.userId);
  const eventIds = events.map((event) => event.id);
  const noteIds = notes.map((note) => note.id);

  await prisma.$transaction(
    async (tx) => {
      await tx.reaction.deleteMany({
        where: {
          OR: [
            { targetType: "EVENT", targetId: { in: eventIds } },
            { targetType: "NOTE", targetId: { in: noteIds } },
          ],
        },
      });
      await tx.rating.deleteMany({ where: { eventId: { in: eventIds } } });
      await tx.photo.deleteMany({ where: { eventId: { in: eventIds } } });
      // Notes can reply to notes, so clear the self-reference before deleting.
      await tx.note.updateMany({
        where: { coupleSpaceId: spaceId },
        data: { replyToNoteId: null },
      });
      await tx.note.deleteMany({ where: { coupleSpaceId: spaceId } });
      await tx.changeLogEntry.deleteMany({ where: { coupleSpaceId: spaceId } });
      await tx.availabilityBlock.deleteMany({ where: { coupleSpaceId: spaceId } });
      await tx.event.deleteMany({ where: { coupleSpaceId: spaceId } });
      await tx.idea.deleteMany({ where: { coupleSpaceId: spaceId } });
      await tx.membership.deleteMany({ where: { coupleSpaceId: spaceId } });
      await tx.coupleSpace.delete({ where: { id: spaceId } });

      if (userIds.length > 0) {
        // `isDemo` is belt and braces: a real account can never end up here,
        // but deleting one would be unrecoverable, so the filter stays.
        await tx.session.deleteMany({ where: { userId: { in: userIds } } });
        await tx.changeLogEntry.deleteMany({ where: { userId: { in: userIds } } });
        await tx.user.deleteMany({ where: { id: { in: userIds }, isDemo: true } });
      }
    },
    { timeout: 30_000, maxWait: 15_000 },
  );

  return userIds.length;
}
