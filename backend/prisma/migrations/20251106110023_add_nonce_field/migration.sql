-- AlterTable
ALTER TABLE "users" ADD COLUMN     "nonce" TEXT NOT NULL DEFAULT '0';

-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "nonce" TEXT NOT NULL DEFAULT '0';
