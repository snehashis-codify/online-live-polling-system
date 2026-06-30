CREATE TYPE "public"."poll_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "status" "poll_status" DEFAULT 'draft' NOT NULL;