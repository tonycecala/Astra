CREATE TABLE "credit_ledger_entries" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"event_type" text NOT NULL,
	"source" text NOT NULL,
	"description" text,
	"related_report_request_id" text,
	"related_report_result_id" text,
	"related_report_document_id" text,
	"related_report_version_id" text,
	"stripe_customer_id" text,
	"stripe_checkout_session_id" text,
	"stripe_event_id" text,
	"idempotency_key" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"product_type" text NOT NULL,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"stripe_customer_id" text,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"stripe_event_id" text,
	"amount_minor" integer,
	"currency" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"purchased_at" timestamp with time zone,
	"raw_event" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"object_id" text,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_event" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_ledger_entries" ADD CONSTRAINT "credit_ledger_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger_entries" ADD CONSTRAINT "credit_ledger_entries_related_report_request_id_astrology_report_requests_id_fk" FOREIGN KEY ("related_report_request_id") REFERENCES "public"."astrology_report_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger_entries" ADD CONSTRAINT "credit_ledger_entries_related_report_result_id_astrology_report_results_id_fk" FOREIGN KEY ("related_report_result_id") REFERENCES "public"."astrology_report_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_ledger_entries_user_idx" ON "credit_ledger_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_ledger_entries_report_request_idx" ON "credit_ledger_entries" USING btree ("related_report_request_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_entries_idempotency_idx" ON "credit_ledger_entries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "products_key_idx" ON "products" USING btree ("key");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("active","product_type");--> statement-breakpoint
CREATE INDEX "purchases_user_idx" ON "purchases" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_stripe_checkout_idx" ON "purchases" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "stripe_events_type_idx" ON "stripe_events" USING btree ("event_type","processed_at");--> statement-breakpoint
INSERT INTO "products" ("key", "name", "product_type", "metadata")
VALUES
	('identity_report', 'Identity Report', 'report', '{"creditCost":1}'::jsonb),
	('core_report', 'Core Natal Report', 'report', '{"creditCost":5}'::jsonb),
	('progressed_report', 'Progressed Report', 'report', '{"creditCost":5}'::jsonb),
	('deep_report', 'Deep Natal Report', 'report', '{"creditCost":10}'::jsonb),
	('synastry_report', 'Synastry Report', 'report', '{"creditCost":10}'::jsonb),
	('core_pack', 'Starter Star Pack', 'credit_pack', '{"credits":5,"priceUsd":9.99}'::jsonb),
	('deep_pack', 'Deep Sky Star Pack', 'credit_pack', '{"credits":10,"priceUsd":19.99}'::jsonb),
	('explorer_pack', 'Explorer Star Pack', 'credit_pack', '{"credits":30,"priceUsd":59.99}'::jsonb)
ON CONFLICT ("key") DO NOTHING;
