/*
  Warnings:

  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `workers` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `workers` table. All the data in the column will be lost.
  - Made the column `walletAddress` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `walletAddress` on table `workers` required. This step will fail if there are existing NULL values in that column.

*/
-- Delete users and workers with NULL wallet addresses (email/password only accounts)
DELETE FROM "users" WHERE "walletAddress" IS NULL;
DELETE FROM "workers" WHERE "walletAddress" IS NULL;

-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "workers_email_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email",
DROP COLUMN "password",
ALTER COLUMN "walletAddress" SET NOT NULL;

-- AlterTable
ALTER TABLE "workers" DROP COLUMN "email",
DROP COLUMN "password",
ALTER COLUMN "walletAddress" SET NOT NULL;
