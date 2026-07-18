ALTER TABLE "polls" RENAME COLUMN "hash_link" TO "link_token";--> statement-breakpoint
ALTER TABLE "polls" DROP CONSTRAINT "polls_hash_link_unique";--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_link_token_unique" UNIQUE("link_token");