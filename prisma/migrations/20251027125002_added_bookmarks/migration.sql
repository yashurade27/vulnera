-- CreateTable
CREATE TABLE "public"."BountyBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BountyBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BountyBookmark_userId_idx" ON "public"."BountyBookmark"("userId");

-- CreateIndex
CREATE INDEX "BountyBookmark_bountyId_idx" ON "public"."BountyBookmark"("bountyId");

-- CreateIndex
CREATE UNIQUE INDEX "BountyBookmark_userId_bountyId_key" ON "public"."BountyBookmark"("userId", "bountyId");

-- AddForeignKey
ALTER TABLE "public"."BountyBookmark" ADD CONSTRAINT "BountyBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BountyBookmark" ADD CONSTRAINT "BountyBookmark_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "public"."Bounty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
