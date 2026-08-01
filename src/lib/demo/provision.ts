import crypto from "crypto";

import { hashPassword } from "@/lib/auth";
import { DEMO_EMAIL_DOMAIN, demoTtlHours } from "@/lib/demo/config";
import { buildDemoContent, type DemoMemberKey } from "@/lib/demo/fixture";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

/**
 * Provisions a throwaway demo space.
 *
 * IDs are generated up front so the whole fixture can be written with a handful
 * of `createMany` calls instead of ~90 sequential round trips — the difference
 * between a snappy `/demo` click and a timed-out transaction on a remote
 * database.
 */

function demoId() {
  return `demo_${crypto.randomBytes(12).toString("base64url")}`;
}

function demoEmail() {
  return `demo-${crypto.randomBytes(8).toString("base64url").toLowerCase()}@${DEMO_EMAIL_DOMAIN}`;
}

export type ProvisionedDemo = {
  spaceId: string;
  sessionToken: string;
};

export async function provisionDemoSpace(now = new Date()): Promise<ProvisionedDemo> {
  const content = buildDemoContent(now);

  // One hash reused by both accounts: it is a random secret nobody ever learns,
  // and hashing twice would just double the cost of entering the demo.
  const passwordHash = await hashPassword(crypto.randomBytes(24).toString("base64url"));

  const spaceId = demoId();
  const userIds = new Map<DemoMemberKey, string>(
    content.members.map((member) => [member.key, demoId()]),
  );
  const userIdFor = (key: DemoMemberKey) => userIds.get(key)!;

  const ideaIds = new Map(content.ideas.map((idea) => [idea.slug, demoId()]));
  const eventIds = new Map(content.events.map((event) => [event.slug, demoId()]));

  /** The event an idea was scheduled into, if any. */
  const scheduledEventIdForIdea = (ideaSlug: string) => {
    const scheduled = content.events.find((event) => event.fromIdeaSlug === ideaSlug);
    return scheduled ? (eventIds.get(scheduled.slug) ?? null) : null;
  };

  const expiresAt = new Date(now.getTime() + demoTtlHours() * 60 * 60 * 1000);

  await prisma.$transaction(
    async (tx) => {
      await tx.user.createMany({
        data: content.members.map((member) => ({
          id: userIdFor(member.key),
          email: demoEmail(),
          name: member.name,
          passwordHash,
          isDemo: true,
          emailRemindersEnabled: false,
        })),
      });

      await tx.coupleSpace.create({
        data: {
          id: spaceId,
          name: content.spaceName,
          inviteCode: `demo-${crypto.randomBytes(6).toString("base64url")}`,
          isDemo: true,
          demoExpiresAt: expiresAt,
        },
      });

      await tx.membership.createMany({
        data: content.members.map((member) => ({
          userId: userIdFor(member.key),
          coupleSpaceId: spaceId,
          role: "member",
          alias: member.alias,
          initials: member.initials,
          color: member.color,
        })),
      });

      // Ideas before events: `Event.originIdeaId` references `Idea`.
      await tx.idea.createMany({
        data: content.ideas.map((idea) => ({
          id: ideaIds.get(idea.slug)!,
          coupleSpaceId: spaceId,
          createdByUserId: userIdFor(idea.by),
          title: idea.title,
          description: idea.description,
          tags: idea.tags,
          status: idea.status,
          createdAt: idea.createdAt,
          convertedToEventId: scheduledEventIdForIdea(idea.slug),
          placeId: idea.place?.placeId ?? null,
          placeName: idea.place?.placeName ?? null,
          placeAddress: idea.place?.placeAddress ?? null,
          placeWebsite: idea.place?.placeWebsite ?? null,
          placePhotoUrls: idea.place?.placePhotoUrls ?? undefined,
        })),
      });

      await tx.event.createMany({
        data: content.events.map((event) => ({
          id: eventIds.get(event.slug)!,
          coupleSpaceId: spaceId,
          createdByUserId: userIdFor(event.by),
          title: event.title,
          description: event.description,
          type: event.type,
          dateTimeStart: event.dateTimeStart,
          dateTimeEnd: event.dateTimeEnd,
          timeIsSet: event.timeIsSet,
          tags: event.tags,
          createdAt: event.createdAt,
          originIdeaId: event.fromIdeaSlug ? (ideaIds.get(event.fromIdeaSlug) ?? null) : null,
          placeId: event.place?.placeId ?? null,
          placeName: event.place?.placeName ?? null,
          placeAddress: event.place?.placeAddress ?? null,
          placeWebsite: event.place?.placeWebsite ?? null,
          placePhotoUrls: event.place?.placePhotoUrls ?? undefined,
        })),
      });

      const photoRows = content.events.flatMap((event) =>
        event.photos.map((photo) => ({
          eventId: eventIds.get(event.slug)!,
          uploadedByUserId: userIdFor(photo.by),
          storageUrl: photo.storageUrl,
          isCover: photo.isCover,
          createdAt: event.dateTimeStart,
        })),
      );
      if (photoRows.length > 0) {
        await tx.photo.createMany({ data: photoRows });
      }

      const ratingRows = content.events
        .filter((event) => event.rating)
        .map((event) => ({
          eventId: eventIds.get(event.slug)!,
          userId: userIdFor(event.rating!.by),
          value: event.rating!.value,
          note: event.rating!.note,
        }));
      if (ratingRows.length > 0) {
        await tx.rating.createMany({ data: ratingRows });
      }

      const noteRows = [
        ...content.events.flatMap((event) =>
          event.comments.map((comment) => ({
            coupleSpaceId: spaceId,
            authorUserId: userIdFor(comment.by),
            body: comment.body,
            kind: "EVENT_COMMENT" as const,
            parentType: "EVENT" as const,
            parentId: eventIds.get(event.slug)!,
            createdAt: comment.createdAt,
          })),
        ),
        ...content.ideas.flatMap((idea) =>
          idea.comments.map((comment) => ({
            coupleSpaceId: spaceId,
            authorUserId: userIdFor(comment.by),
            body: comment.body,
            kind: "IDEA_COMMENT" as const,
            parentType: "IDEA" as const,
            parentId: ideaIds.get(idea.slug)!,
            createdAt: comment.createdAt,
          })),
        ),
        ...content.notes.map((note) => ({
          coupleSpaceId: spaceId,
          authorUserId: userIdFor(note.by),
          body: note.body,
          kind: "MANUAL" as const,
          parentType: null,
          parentId: null,
          createdAt: note.createdAt,
        })),
      ];
      if (noteRows.length > 0) {
        await tx.note.createMany({ data: noteRows });
      }

      await tx.availabilityBlock.createMany({
        data: content.blocks.map((block) => ({
          coupleSpaceId: spaceId,
          createdByUserId: userIdFor(block.by),
          title: block.title,
          note: block.note,
          startAt: block.startAt,
          endAt: block.endAt,
        })),
      });

      // Gives the activity feed a populated history without replaying every
      // mutation through the domain layer.
      await tx.changeLogEntry.createMany({
        data: [
          ...content.events.map((event) => ({
            coupleSpaceId: spaceId,
            entityType: "EVENT" as const,
            entityId: eventIds.get(event.slug)!,
            userId: userIdFor(event.by),
            changeType: "CREATE" as const,
            summary: `Added ${event.type === "MEMORY" ? "memory" : "plan"} "${event.title}"`,
            createdAt: event.createdAt,
          })),
          ...content.ideas.map((idea) => ({
            coupleSpaceId: spaceId,
            entityType: "IDEA" as const,
            entityId: ideaIds.get(idea.slug)!,
            userId: userIdFor(idea.by),
            changeType: "CREATE" as const,
            summary: `Added idea "${idea.title}"`,
            createdAt: idea.createdAt,
          })),
        ],
      });
    },
    { timeout: 30_000, maxWait: 15_000 },
  );

  // The visitor is signed in as the first member.
  const sessionToken = await createSession(userIdFor(content.members[0].key));

  return { spaceId, sessionToken };
}

export async function countLiveDemoSpaces(now = new Date()) {
  return prisma.coupleSpace.count({
    where: {
      isDemo: true,
      demoExpiresAt: { gt: now },
    },
  });
}
