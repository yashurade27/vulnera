/*
  Warnings:

  - You are about to drop the column `publicId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."User_publicId_key";

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "reputation" DOUBLE PRECISION NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "publicId";
