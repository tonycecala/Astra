CREATE TABLE "composer_queue_publish_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"operator_key" text NOT NULL,
	"scope" text NOT NULL,
	"draft_id" text,
	"target_user_id" text NOT NULL,
	"status" text DEFAULT 'prepared' NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"selected_card_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"query_cache_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "composer_queue_publish_plans_operator_scope_idx" ON "composer_queue_publish_plans" USING btree ("operator_key","scope","updated_at");--> statement-breakpoint
CREATE INDEX "composer_queue_publish_plans_status_idx" ON "composer_queue_publish_plans" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "composer_queue_publish_plans_target_user_idx" ON "composer_queue_publish_plans" USING btree ("target_user_id","updated_at");