-- Bỏ hẳn mã theo dõi/QR: người nhà nay do nhân viên đăng ký (SĐT + họ tên)

-- DropForeignKey
ALTER TABLE "family_links" DROP CONSTRAINT "family_links_code_id_fkey";

-- DropForeignKey
ALTER TABLE "tracking_codes" DROP CONSTRAINT "tracking_codes_created_by_fkey";

-- DropForeignKey
ALTER TABLE "tracking_codes" DROP CONSTRAINT "tracking_codes_surgery_id_fkey";

-- AlterTable
ALTER TABLE "family_links" DROP COLUMN "code_id";

-- DropTable
DROP TABLE "tracking_codes";

-- DropEnum
DROP TYPE "TrackingCodeStatus";

