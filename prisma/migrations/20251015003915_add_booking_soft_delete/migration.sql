-- DropIndex
DROP INDEX "Booking_userId_startAt_endAt_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Booking_userId_startAt_endAt_deletedAt_idx" ON "Booking"("userId", "startAt", "endAt", "deletedAt");
