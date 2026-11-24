-- AlterTable
ALTER TABLE "status_definitions" ADD COLUMN     "expected_minutes" INTEGER;

-- AlterTable
ALTER TABLE "surgeries" ADD COLUMN     "expected_minutes" INTEGER;
