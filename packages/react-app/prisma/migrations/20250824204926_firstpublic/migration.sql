/*
  Warnings:

  - You are about to drop the column `claimable` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isTester` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "ageRestriction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "countries" TEXT,
ADD COLUMN     "countryRestriction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "genderRestriction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAge" INTEGER,
ADD COLUMN     "minAge" INTEGER,
ADD COLUMN     "restrictionsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "claimable",
DROP COLUMN "isTester";
