-- Add price column with default value first
ALTER TABLE "datasets" ADD COLUMN "price" integer DEFAULT 0;
-- Update existing records to have a default price
UPDATE "datasets" SET "price" = 0 WHERE "price" IS NULL;
-- Now make it NOT NULL
ALTER TABLE "datasets" ALTER COLUMN "price" SET NOT NULL;