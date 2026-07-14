-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
