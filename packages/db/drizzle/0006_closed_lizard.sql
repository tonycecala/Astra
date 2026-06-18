CREATE TABLE "composer_library_collection_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"collection_id" text NOT NULL,
	"card_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"ontology_type" text NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"section_id" text,
	"section_title" text,
	"image_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"card_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "composer_library_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"source" text DEFAULT 'composer' NOT NULL,
	"total_cards" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "composer_library_collection_cards" ADD CONSTRAINT "composer_library_collection_cards_collection_id_composer_library_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."composer_library_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "composer_library_collection_cards_collection_order_idx" ON "composer_library_collection_cards" USING btree ("collection_id","order_index");--> statement-breakpoint
CREATE UNIQUE INDEX "composer_library_collection_cards_collection_card_idx" ON "composer_library_collection_cards" USING btree ("collection_id","card_id");--> statement-breakpoint
CREATE INDEX "composer_library_collection_cards_ontology_idx" ON "composer_library_collection_cards" USING btree ("ontology_type","collection_id");--> statement-breakpoint
CREATE INDEX "composer_library_collection_cards_section_idx" ON "composer_library_collection_cards" USING btree ("collection_id","section_id","order_index");--> statement-breakpoint
CREATE INDEX "composer_library_collection_cards_status_idx" ON "composer_library_collection_cards" USING btree ("status","collection_id");--> statement-breakpoint
CREATE INDEX "composer_library_collections_kind_status_idx" ON "composer_library_collections" USING btree ("kind","status","updated_at");--> statement-breakpoint
CREATE INDEX "composer_library_collections_source_idx" ON "composer_library_collections" USING btree ("source","updated_at");