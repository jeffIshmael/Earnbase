/*
  Warnings:

  - A unique constraint covering the columns `[agentRequestId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "agentRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Task_agentRequestId_key" ON "Task"("agentRequestId");
