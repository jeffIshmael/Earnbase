/*
  Warnings:

  - A unique constraint covering the columns `[paymentTxHash]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "paymentTxHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Task_paymentTxHash_key" ON "Task"("paymentTxHash");
