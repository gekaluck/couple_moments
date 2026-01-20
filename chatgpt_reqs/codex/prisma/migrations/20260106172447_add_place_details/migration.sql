-- AlterTable
ALTER TABLE "Event" ADD COLUMN "placeOpeningHours" JSONB;
ALTER TABLE "Event" ADD COLUMN "placePhotoUrls" JSONB;
ALTER TABLE "Event" ADD COLUMN "placeWebsite" TEXT;

-- AlterTable
ALTER TABLE "Idea" ADD COLUMN "placeOpeningHours" JSONB;
ALTER TABLE "Idea" ADD COLUMN "placePhotoUrls" JSONB;
ALTER TABLE "Idea" ADD COLUMN "placeWebsite" TEXT;
