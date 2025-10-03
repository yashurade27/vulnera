-- Convert single bountyType enum to bountyTypes array
DO $$
BEGIN
  BEGIN
    ALTER TABLE "public"."Bounty" ADD COLUMN "bountyTypes" "public"."BountyType"[] NOT NULL DEFAULT ARRAY[]::"public"."BountyType"[];
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  -- Backfill existing data only when the legacy column is still present
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Bounty'
      AND column_name = 'bountyType'
  ) THEN
    EXECUTE 'UPDATE "public"."Bounty" SET "bountyTypes" = ARRAY["bountyType"]::"public"."BountyType"[] WHERE "bountyType" IS NOT NULL AND ("bountyTypes" IS NULL OR cardinality("bountyTypes") = 0)';

    ALTER TABLE "public"."Bounty" DROP COLUMN "bountyType";
  END IF;
END $$;
