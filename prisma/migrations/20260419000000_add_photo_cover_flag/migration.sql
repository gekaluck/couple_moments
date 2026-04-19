ALTER TABLE "Photo"
ADD COLUMN "isCover" BOOLEAN NOT NULL DEFAULT false;

WITH first_photo AS (
  SELECT DISTINCT ON ("eventId") "id"
  FROM "Photo"
  ORDER BY "eventId", "createdAt" ASC, "id" ASC
)
UPDATE "Photo"
SET "isCover" = true
WHERE "id" IN (SELECT "id" FROM first_photo);

CREATE UNIQUE INDEX "Photo_eventId_cover_unique"
ON "Photo" ("eventId")
WHERE "isCover" = true;
