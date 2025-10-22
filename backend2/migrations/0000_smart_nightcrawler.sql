CREATE TABLE "datasets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "datasets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" text,
	"ipfs_hash" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar(50),
	"owner_address" varchar(42) NOT NULL,
	"purchasers" text[] DEFAULT '{}'::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
