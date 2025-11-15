/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress]` on the table `workers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "walletAddress" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "workers_walletAddress_key" ON "workers"("walletAddress");
