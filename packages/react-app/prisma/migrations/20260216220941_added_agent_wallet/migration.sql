/*
  Warnings:

  - You are about to drop the column `contactInfo` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `contactMethod` on the `Task` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_creatorId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "contactInfo",
DROP COLUMN "contactMethod",
ADD COLUMN     "feedbackType" TEXT,
ADD COLUMN     "uuid" TEXT,
ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "maxBonusReward" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Task_uuid_key" ON "Task"("uuid");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
