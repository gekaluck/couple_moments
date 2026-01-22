import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function isoDay(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

async function main() {
  const spaceId = process.argv[2];
  const shouldReset = process.argv.includes("--reset");
  if (!spaceId) {
    throw new Error("Usage: tsx scripts/seed-demo.ts <spaceId> [--reset]");
  }

  const space = await prisma.coupleSpace.findUnique({
    where: { id: spaceId },
  });
  if (!space) {
    throw new Error(`Space not found: ${spaceId}`);
  }

  const memberships = await prisma.membership.findMany({
    where: { coupleSpaceId: spaceId },
    select: { userId: true },
  });

  if (memberships.length === 0) {
    throw new Error("No members found for this space.");
  }

  const userIds = memberships.map((m) => m.userId);
  const now = new Date();

  if (shouldReset) {
    const eventIds = await prisma.event.findMany({
      where: { coupleSpaceId: spaceId },
      select: { id: true },
    });
    const noteIds = await prisma.note.findMany({
      where: { coupleSpaceId: spaceId },
      select: { id: true },
    });

    await prisma.reaction.deleteMany({
      where: {
        OR: [
          { targetType: "EVENT", targetId: { in: eventIds.map((event) => event.id) } },
          { targetType: "NOTE", targetId: { in: noteIds.map((note) => note.id) } },
        ],
      },
    });
    await prisma.note.deleteMany({
      where: { coupleSpaceId: spaceId },
    });
    await prisma.availabilityBlock.deleteMany({
      where: { coupleSpaceId: spaceId },
    });
    await prisma.event.deleteMany({
      where: { coupleSpaceId: spaceId },
    });
    await prisma.idea.deleteMany({
      where: { coupleSpaceId: spaceId },
    });
    await prisma.changeLogEntry.deleteMany({
      where: { userId: { in: userIds } },
    });
  }

  const ideaTitles = [
    "Morning coffee walk",
    "Try the new sushi bar",
    "Weekend hike",
    "Movie night at home",
    "Sunset picnic",
    "Museum visit",
    "Bookstore date",
    "Cook pasta together",
  ];

  const eventTitles = [
    "Rooftop dinner",
    "City lights stroll",
    "Brunch at Luma",
    "Gallery afternoon",
    "Rainy day movie",
    "Farmers market run",
    "Bistro date",
    "Kayak morning",
    "Beach escape",
    "Late night dessert",
    "Cozy tea time",
    "Record shop visit",
    "Garden walk",
    "Sunrise drive",
  ];

  const noteContents = [
    "Remember the playlist for the drive.",
    "Check for late seating options.",
    "Bring a blanket.",
    "Find a spot near the window.",
    "Pack snacks for the ride.",
    "Confirm tickets the day before.",
    "Make time for photos.",
    "Try the matcha dessert.",
    "Ask about vegan options.",
    "Plan a quick stop at the park.",
    "Save the cafe address.",
    "Buy flowers on the way.",
  ];

  const createdIdeas = [];
  for (let i = 0; i < 8; i += 1) {
    const idea = await prisma.idea.create({
      data: {
        coupleSpaceId: spaceId,
        createdByUserId: pick(userIds, i),
        title: pick(ideaTitles, i),
        description: `Idea details for ${pick(ideaTitles, i).toLowerCase()}.`,
        tags: JSON.stringify(["cozy", "weekend"]),
        status: i % 3 === 0 ? "DONE" : i % 3 === 1 ? "PLANNED" : "NEW",
      },
    });
    createdIdeas.push(idea);

    if (i % 2 === 0) {
      await prisma.note.create({
        data: {
          coupleSpaceId: spaceId,
          authorUserId: pick(userIds, i + 1),
          body: "This sounds fun. Let's do it soon.",
          kind: "IDEA_COMMENT",
          parentType: "IDEA",
          parentId: idea.id,
        },
      });
    }
  }

  const createdEvents = [];
  for (let i = 0; i < 14; i += 1) {
    const dayOffset = i - 4;
    const dateTimeStart = new Date(`${isoDay(addDays(now, dayOffset))}T19:00:00`);
    const type = i % 3 === 0 ? "MEMORY" : "PLANNED";
    const event = await prisma.event.create({
      data: {
        coupleSpaceId: spaceId,
        createdByUserId: pick(userIds, i),
        title: pick(eventTitles, i),
        description: `Notes for ${pick(eventTitles, i).toLowerCase()}.`,
        type,
        dateTimeStart,
        dateTimeEnd: null,
        tags: JSON.stringify(["date", "together"]),
      },
    });
    createdEvents.push(event);

    if (i % 2 === 0) {
      const note = await prisma.note.create({
        data: {
          coupleSpaceId: spaceId,
          authorUserId: pick(userIds, i + 1),
          body: "Looking forward to this.",
          kind: "EVENT_COMMENT",
          parentType: "EVENT",
          parentId: event.id,
        },
      });

      await prisma.reaction.create({
        data: {
          userId: pick(userIds, i),
          targetType: "NOTE",
          targetId: note.id,
          emoji: "+1",
        },
      });
    }

    if (i % 4 === 0) {
      await prisma.reaction.create({
        data: {
          userId: pick(userIds, i + 1),
          targetType: "EVENT",
          targetId: event.id,
          emoji: "<3",
        },
      });
    }
  }

  for (let i = 0; i < 12; i += 1) {
    await prisma.note.create({
      data: {
        coupleSpaceId: spaceId,
        authorUserId: pick(userIds, i),
        body: pick(noteContents, i),
        kind: "MANUAL",
      },
    });
  }

  await prisma.availabilityBlock.createMany({
    data: [
      {
        coupleSpaceId: spaceId,
        createdByUserId: pick(userIds, 0),
        title: "Out of town",
        note: "Conference week",
        startAt: addDays(now, 6),
        endAt: addDays(now, 10),
      },
      {
        coupleSpaceId: spaceId,
        createdByUserId: pick(userIds, 1),
        title: "Family visit",
        note: "Weekend trip",
        startAt: addDays(now, -2),
        endAt: addDays(now, 1),
      },
    ],
  });

  if (createdIdeas.length > 0) {
    const idea = createdIdeas[0];
    const event = await prisma.event.create({
      data: {
        coupleSpaceId: spaceId,
        createdByUserId: pick(userIds, 0),
        title: `${idea.title} (scheduled)`,
        description: idea.description,
        type: "PLANNED",
        dateTimeStart: addDays(now, 9),
        dateTimeEnd: null,
        tags: idea.tags,
        originIdeaId: idea.id,
      },
    });

    await prisma.idea.update({
      where: { id: idea.id },
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
  }

  console.log(
    `Seeded demo data for space ${spaceId}${shouldReset ? " (reset)" : ""}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
