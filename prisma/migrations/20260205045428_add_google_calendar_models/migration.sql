-- CreateTable
CREATE TABLE "ExternalAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCalendar" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "backgroundColor" TEXT,
    "foregroundColor" TEXT,

    CONSTRAINT "ExternalCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'GOOGLE',

    CONSTRAINT "ExternalAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSyncState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "syncToken" TEXT,
    "channelId" TEXT,
    "resourceId" TEXT,
    "channelExpiration" TIMESTAMP(3),

    CONSTRAINT "ExternalSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalAccount_userId_idx" ON "ExternalAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAccount_userId_provider_key" ON "ExternalAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "ExternalCalendar_externalAccountId_idx" ON "ExternalCalendar"("externalAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalCalendar_externalAccountId_calendarId_key" ON "ExternalCalendar"("externalAccountId", "calendarId");

-- CreateIndex
CREATE INDEX "ExternalAvailabilityBlock_userId_startAt_idx" ON "ExternalAvailabilityBlock"("userId", "startAt");

-- CreateIndex
CREATE INDEX "ExternalAvailabilityBlock_externalAccountId_idx" ON "ExternalAvailabilityBlock"("externalAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSyncState_externalAccountId_key" ON "ExternalSyncState"("externalAccountId");

-- AddForeignKey
ALTER TABLE "ExternalAccount" ADD CONSTRAINT "ExternalAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCalendar" ADD CONSTRAINT "ExternalCalendar_externalAccountId_fkey" FOREIGN KEY ("externalAccountId") REFERENCES "ExternalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAvailabilityBlock" ADD CONSTRAINT "ExternalAvailabilityBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAvailabilityBlock" ADD CONSTRAINT "ExternalAvailabilityBlock_externalAccountId_fkey" FOREIGN KEY ("externalAccountId") REFERENCES "ExternalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalSyncState" ADD CONSTRAINT "ExternalSyncState_externalAccountId_fkey" FOREIGN KEY ("externalAccountId") REFERENCES "ExternalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
