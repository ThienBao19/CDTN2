-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE 'SKIPPED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "last_error" TEXT;
