ALTER TABLE "datasets" ADD COLUMN "blockchain_pool_id" integer;--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_blockchain_pool_id_unique" UNIQUE("blockchain_pool_id");