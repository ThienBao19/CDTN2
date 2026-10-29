-- DropForeignKey
ALTER TABLE "family_links" DROP CONSTRAINT "family_links_code_id_fkey";

-- AlterTable
ALTER TABLE "family_links" ADD COLUMN     "added_by" TEXT,
ADD COLUMN     "contact_name" TEXT,
ALTER COLUMN "code_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "tracking_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
