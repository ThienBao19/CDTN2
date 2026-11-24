/*
  Warnings:

  - A unique constraint covering the columns `[user_id,overdue_stage_history_id]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "overdue_stage_history_id" TEXT;

-- CreateIndex
CREATE INDEX "notifications_overdue_stage_history_id_idx" ON "notifications"("overdue_stage_history_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_overdue_stage_history_id_key" ON "notifications"("user_id", "overdue_stage_history_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_overdue_stage_history_id_fkey" FOREIGN KEY ("overdue_stage_history_id") REFERENCES "status_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
