CREATE TYPE "public"."response_mode" AS ENUM('anonymous', 'authenticated');--> statement-breakpoint
CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"respondent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "responseMode" "response_mode" DEFAULT 'anonymous' NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "is_mandatory" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_option_id_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_respondent_id_users_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answers_response_idx" ON "answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "answers_option_idx" ON "answers" USING btree ("option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "poll_respondent_idx" ON "responses" USING btree ("poll_id","respondent_id") WHERE "responses"."respondent_id" is not null;--> statement-breakpoint
CREATE INDEX "responses_poll_idx" ON "responses" USING btree ("poll_id");