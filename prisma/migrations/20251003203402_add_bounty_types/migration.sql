/*
  Warnings:

  - You are about to drop the column `bountyType` on the `Bounty` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Bounty_status_bountyType_idx";

-- AlterTable
ALTER TABLE "public"."Bounty" DROP COLUMN "bountyType",
ADD COLUMN     "bountyTypes" "public"."BountyType"[] DEFAULT ARRAY[]::"public"."BountyType"[];
