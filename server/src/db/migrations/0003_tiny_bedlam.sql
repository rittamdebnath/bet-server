ALTER TABLE "invitation" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "created_at" DROP NOT NULL;