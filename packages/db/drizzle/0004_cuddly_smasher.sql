CREATE TABLE "composer_card_query_caches" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"fingerprint" text NOT NULL,
	"page" integer NOT NULL,
	"page_size" integer NOT NULL,
	"total_cards" integer NOT NULL,
	"window_start" integer NOT NULL,
	"window_end" integer NOT NULL,
	"card_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facets" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "composer_queue_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"operator_key" text NOT NULL,
	"scope" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"target_user_id" text,
	"selected_cards" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"queue_states" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"decision_notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"query_cache_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_plan_id" text,
	"last_plan_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "composer_card_query_caches_scope_idx" ON "composer_card_query_caches" USING btree ("scope","updated_at");--> statement-breakpoint
CREATE INDEX "composer_card_query_caches_fingerprint_idx" ON "composer_card_query_caches" USING btree ("fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "composer_queue_drafts_operator_scope_idx" ON "composer_queue_drafts" USING btree ("operator_key","scope");--> statement-breakpoint
CREATE INDEX "composer_queue_drafts_status_idx" ON "composer_queue_drafts" USING btree ("status","updated_at");