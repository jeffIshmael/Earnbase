/*
  Warnings:

  - Added the required column `aiCriteria` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseReward` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactInfo` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactMethod` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxBonusReward` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxParticipants` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDeposited` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'WHATSAPP', 'BOTH');

-- CreateEnum
CREATE TYPE "SubtaskType" AS ENUM ('MULTIPLE_CHOICE', 'TEXT_INPUT', 'FILE_UPLOAD', 'CHOICE_SELECTION', 'RATING');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REWARDED');

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- AlterTable - Add all new columns first
ALTER TABLE "Task" ADD COLUMN     "aiCriteria" TEXT,
ADD COLUMN     "baseReward" BIGINT,
ADD COLUMN     "contactInfo" TEXT,
ADD COLUMN     "contactMethod" "ContactMethod",
ADD COLUMN     "creatorId" INTEGER,
ADD COLUMN     "currentParticipants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "maxBonusReward" BIGINT,
ADD COLUMN     "maxParticipants" INTEGER,
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "totalDeposited" BIGINT,
ALTER COLUMN "subTaskId" DROP NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- Create a default user if none exists (for creatorId foreign key)
INSERT INTO "User" ("userName", "walletAddress", "totalEarned", "claimable", "isTester")
VALUES ('System User', '0x0000000000000000000000000000000000000000', 0, 0, false)
ON CONFLICT ("walletAddress") DO NOTHING;

-- Update existing tasks with default values for the new required columns
UPDATE "Task" SET 
  "title" = 'Legacy Task',
  "description" = 'This is a legacy task from the previous system',
  "maxParticipants" = 10,
  "baseReward" = 0,
  "maxBonusReward" = 0,
  "totalDeposited" = 0,
  "aiCriteria" = 'Legacy task - no specific criteria defined',
  "contactMethod" = 'EMAIL',
  "contactInfo" = 'legacy@earnbase.com',
  "creatorId" = (SELECT "id" FROM "User" WHERE "walletAddress" = '0x0000000000000000000000000000000000000000' LIMIT 1)
WHERE "title" IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE "Task" ALTER COLUMN "aiCriteria" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "baseReward" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "contactInfo" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "contactMethod" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "maxBonusReward" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "maxParticipants" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "totalDeposited" SET NOT NULL;

-- CreateTable
CREATE TABLE "TaskSubtask" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "SubtaskType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "options" TEXT,
    "placeholder" TEXT,
    "maxLength" INTEGER,
    "fileTypes" TEXT,

    CONSTRAINT "TaskSubtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSubmission" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "aiRating" INTEGER,
    "aiFeedback" TEXT,
    "reward" BIGINT NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubtaskResponse" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "subtaskId" INTEGER NOT NULL,
    "response" TEXT NOT NULL,
    "fileUrl" TEXT,

    CONSTRAINT "SubtaskResponse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubtask" ADD CONSTRAINT "TaskSubtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskResponse" ADD CONSTRAINT "SubtaskResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "TaskSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskResponse" ADD CONSTRAINT "SubtaskResponse_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "TaskSubtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
