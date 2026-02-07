-- CreateTable
CREATE TABLE "ExternalEventLink" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "etag" TEXT,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalEventLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalEventLink_eventId_key" ON "ExternalEventLink"("eventId");

-- CreateIndex
CREATE INDEX "ExternalEventLink_externalAccountId_idx" ON "ExternalEventLink"("externalAccountId");

-- AddForeignKey
ALTER TABLE "ExternalEventLink" ADD CONSTRAINT "ExternalEventLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEventLink" ADD CONSTRAINT "ExternalEventLink_externalAccountId_fkey" FOREIGN KEY ("externalAccountId") REFERENCES "ExternalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
