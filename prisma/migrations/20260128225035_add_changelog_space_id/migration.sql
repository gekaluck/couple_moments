-- AlterTable
ALTER TABLE "ChangeLogEntry" ADD COLUMN     "coupleSpaceId" TEXT;

-- CreateIndex
CREATE INDEX "ChangeLogEntry_coupleSpaceId_createdAt_idx" ON "ChangeLogEntry"("coupleSpaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChangeLogEntry" ADD CONSTRAINT "ChangeLogEntry_coupleSpaceId_fkey" FOREIGN KEY ("coupleSpaceId") REFERENCES "CoupleSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
