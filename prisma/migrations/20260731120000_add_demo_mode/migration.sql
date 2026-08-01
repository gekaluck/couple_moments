ALTER TABLE "User"
ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CoupleSpace"
ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "demoExpiresAt" TIMESTAMP(3);

CREATE INDEX "CoupleSpace_isDemo_demoExpiresAt_idx" ON "CoupleSpace"("isDemo", "demoExpiresAt");
