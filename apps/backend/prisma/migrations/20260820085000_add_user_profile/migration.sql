-- CreateEnum
CREATE TYPE "UserProfile" AS ENUM ('COACH', 'MANAGER', 'PLAYER', 'FAN', 'ENTHUSIAST');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile" "UserProfile";
