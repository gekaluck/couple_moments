-- Create new Reaction table
CREATE TABLE "Reaction_new" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  CONSTRAINT "Reaction_new_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create new Note table
CREATE TABLE "Note_new" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "coupleSpaceId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "parentType" TEXT,
  "parentId" TEXT,
  "replyToNoteId" TEXT,
  CONSTRAINT "Note_new_coupleSpaceId_fkey" FOREIGN KEY ("coupleSpaceId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Note_new_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Note_new_replyToNoteId_fkey" FOREIGN KEY ("replyToNoteId") REFERENCES "Note_new" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Add new fields to Event (originIdeaId)
ALTER TABLE "Event" ADD COLUMN "originIdeaId" TEXT;

-- Add convertedToEventId to Idea
ALTER TABLE "Idea" ADD COLUMN "convertedToEventId" TEXT;

-- Copy linkedEventId into convertedToEventId
UPDATE "Idea"
SET "convertedToEventId" = "linkedEventId"
WHERE "linkedEventId" IS NOT NULL;

-- Copy idea linkage into Event.originIdeaId
UPDATE "Event"
SET "originIdeaId" = (
  SELECT "id" FROM "Idea" WHERE "convertedToEventId" = "Event"."id" LIMIT 1
)
WHERE "originIdeaId" IS NULL;

-- Migrate existing notes
INSERT INTO "Note_new" ("id", "createdAt", "updatedAt", "coupleSpaceId", "authorUserId", "body", "kind", "parentType", "parentId", "replyToNoteId")
SELECT
  "id",
  "createdAt",
  "updatedAt",
  "coupleSpaceId",
  "createdByUserId",
  "content",
  CASE
    WHEN "sourceType" = 'COMMENT' AND "eventId" IS NOT NULL THEN 'EVENT_COMMENT'
    WHEN "sourceType" = 'COMMENT' AND "ideaId" IS NOT NULL THEN 'IDEA_COMMENT'
    ELSE 'MANUAL'
  END,
  CASE
    WHEN "eventId" IS NOT NULL THEN 'EVENT'
    WHEN "ideaId" IS NOT NULL THEN 'IDEA'
    ELSE NULL
  END,
  COALESCE("eventId", "ideaId"),
  NULL
FROM "Note";

-- Migrate Event comments
INSERT INTO "Note_new" ("id", "createdAt", "updatedAt", "coupleSpaceId", "authorUserId", "body", "kind", "parentType", "parentId", "replyToNoteId")
SELECT
  "Comment"."id",
  "Comment"."createdAt",
  "Comment"."updatedAt",
  "Event"."coupleSpaceId",
  "Comment"."userId",
  "Comment"."content",
  'EVENT_COMMENT',
  'EVENT',
  "Comment"."eventId",
  NULL
FROM "Comment"
JOIN "Event" ON "Event"."id" = "Comment"."eventId";

-- Migrate Idea comments
INSERT INTO "Note_new" ("id", "createdAt", "updatedAt", "coupleSpaceId", "authorUserId", "body", "kind", "parentType", "parentId", "replyToNoteId")
SELECT
  "IdeaComment"."id",
  "IdeaComment"."createdAt",
  "IdeaComment"."updatedAt",
  "Idea"."coupleSpaceId",
  "IdeaComment"."userId",
  "IdeaComment"."content",
  'IDEA_COMMENT',
  'IDEA',
  "IdeaComment"."ideaId",
  NULL
FROM "IdeaComment"
JOIN "Idea" ON "Idea"."id" = "IdeaComment"."ideaId";

-- Migrate Event reactions
INSERT INTO "Reaction_new" ("id", "createdAt", "userId", "targetType", "targetId", "emoji")
SELECT
  "id",
  "createdAt",
  "userId",
  'EVENT',
  "eventId",
  "emoji"
FROM "Reaction";

-- Migrate Note reactions
INSERT INTO "Reaction_new" ("id", "createdAt", "userId", "targetType", "targetId", "emoji")
SELECT
  "id",
  "createdAt",
  "userId",
  'NOTE',
  "noteId",
  "emoji"
FROM "NoteReaction";

-- Rebuild Idea table without linkedEventId
CREATE TABLE "Idea_new" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "coupleSpaceId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "tags" TEXT NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "convertedToEventId" TEXT,
  CONSTRAINT "Idea_new_coupleSpaceId_fkey" FOREIGN KEY ("coupleSpaceId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Idea_new_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Idea_new_convertedToEventId_fkey" FOREIGN KEY ("convertedToEventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "Idea_new" ("id", "createdAt", "updatedAt", "coupleSpaceId", "createdByUserId", "title", "description", "tags", "status", "convertedToEventId")
SELECT
  "id",
  "createdAt",
  "updatedAt",
  "coupleSpaceId",
  "createdByUserId",
  "title",
  "description",
  "tags",
  "status",
  "convertedToEventId"
FROM "Idea";

DROP TABLE "Comment";
DROP TABLE "IdeaComment";
DROP TABLE "NoteReaction";
DROP TABLE "Reaction";
DROP TABLE "Note";
DROP TABLE "Idea";

ALTER TABLE "Note_new" RENAME TO "Note";
ALTER TABLE "Reaction_new" RENAME TO "Reaction";
ALTER TABLE "Idea_new" RENAME TO "Idea";

CREATE UNIQUE INDEX "Idea_convertedToEventId_key" ON "Idea" ("convertedToEventId");
CREATE UNIQUE INDEX "Event_originIdeaId_key" ON "Event" ("originIdeaId");
