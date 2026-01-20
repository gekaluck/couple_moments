-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "coupleSpaceId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "dateTimeStart" DATETIME NOT NULL,
    "dateTimeEnd" DATETIME,
    "timeIsSet" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "originIdeaId" TEXT,
    "placeId" TEXT,
    "placeName" TEXT,
    "placeAddress" TEXT,
    "placeLat" REAL,
    "placeLng" REAL,
    "placeUrl" TEXT,
    "placeWebsite" TEXT,
    "placeOpeningHours" JSONB,
    "placePhotoUrls" JSONB,
    CONSTRAINT "Event_coupleSpaceId_fkey" FOREIGN KEY ("coupleSpaceId") REFERENCES "CoupleSpace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_originIdeaId_fkey" FOREIGN KEY ("originIdeaId") REFERENCES "Idea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("coupleSpaceId", "createdAt", "createdByUserId", "dateTimeEnd", "dateTimeStart", "description", "id", "originIdeaId", "placeAddress", "placeId", "placeLat", "placeLng", "placeName", "placeOpeningHours", "placePhotoUrls", "placeUrl", "placeWebsite", "tags", "title", "type", "updatedAt") SELECT "coupleSpaceId", "createdAt", "createdByUserId", "dateTimeEnd", "dateTimeStart", "description", "id", "originIdeaId", "placeAddress", "placeId", "placeLat", "placeLng", "placeName", "placeOpeningHours", "placePhotoUrls", "placeUrl", "placeWebsite", "tags", "title", "type", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_originIdeaId_key" ON "Event"("originIdeaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
