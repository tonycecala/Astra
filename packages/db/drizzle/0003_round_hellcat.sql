CREATE TABLE "composer_decisions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"user_feed_item_id" text NOT NULL,
	"decision_version" text NOT NULL,
	"input_context_hash" text NOT NULL,
	"candidate_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"selected_candidate_id" text NOT NULL,
	"rank_features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"suppression_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"safety_notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_stream_items" (
	"id" text PRIMARY KEY NOT NULL,
	"source_card_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"audience_scope" text DEFAULT 'all' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body_template" text NOT NULL,
	"card_type" text DEFAULT 'reflection' NOT NULL,
	"topic_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"symbolic_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"eligibility_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"safety_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feed_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"source_card_id" text,
	"artifact_id" text,
	"achievement_id" text,
	"ally_id" text,
	"gift_id" text,
	"feed_kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"display_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rank_score" integer DEFAULT 0 NOT NULL,
	"reason_code" text NOT NULL,
	"state" text DEFAULT 'available' NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"seen_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"saved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "composer_decisions" ADD CONSTRAINT "composer_decisions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "composer_decisions" ADD CONSTRAINT "composer_decisions_user_feed_item_id_user_feed_items_id_fk" FOREIGN KEY ("user_feed_item_id") REFERENCES "public"."user_feed_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_stream_items" ADD CONSTRAINT "public_stream_items_source_card_id_source_cards_id_fk" FOREIGN KEY ("source_card_id") REFERENCES "public"."source_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feed_items" ADD CONSTRAINT "user_feed_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feed_items" ADD CONSTRAINT "user_feed_items_source_card_id_source_cards_id_fk" FOREIGN KEY ("source_card_id") REFERENCES "public"."source_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feed_items" ADD CONSTRAINT "user_feed_items_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feed_items" ADD CONSTRAINT "user_feed_items_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feed_items" ADD CONSTRAINT "user_feed_items_ally_id_allies_id_fk" FOREIGN KEY ("ally_id") REFERENCES "public"."allies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feed_items" ADD CONSTRAINT "user_feed_items_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "composer_decisions_user_idx" ON "composer_decisions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "composer_decisions_user_feed_item_idx" ON "composer_decisions" USING btree ("user_feed_item_id");--> statement-breakpoint
CREATE INDEX "public_stream_items_feed_idx" ON "public_stream_items" USING btree ("status","publish_at");--> statement-breakpoint
CREATE INDEX "public_stream_items_source_card_idx" ON "public_stream_items" USING btree ("source_card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "source_cards_slug_idx" ON "source_cards" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "source_cards_status_idx" ON "source_cards" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "user_feed_items_user_feed_idx" ON "user_feed_items" USING btree ("user_id","state","available_at");--> statement-breakpoint
CREATE INDEX "user_feed_items_source_card_idx" ON "user_feed_items" USING btree ("source_card_id");--> statement-breakpoint
CREATE INDEX "user_feed_items_artifact_idx" ON "user_feed_items" USING btree ("artifact_id");