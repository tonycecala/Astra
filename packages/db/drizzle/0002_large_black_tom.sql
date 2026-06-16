CREATE TABLE "astrology_report_requests" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"chart_request_id" text,
	"report_type" text NOT NULL,
	"subject_name" text NOT NULL,
	"birth_data" jsonb NOT NULL,
	"question" text,
	"intent" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text DEFAULT 'self' NOT NULL,
	"boundary" text DEFAULT 'private' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"engine" text,
	"engine_version" text,
	"cost_credits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "astrology_report_results" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"request_id" text NOT NULL,
	"user_id" text NOT NULL,
	"engine" text NOT NULL,
	"engine_version" text NOT NULL,
	"status" text NOT NULL,
	"summary" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provenance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"public_signal" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "astrology_report_requests" ADD CONSTRAINT "astrology_report_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "astrology_report_requests" ADD CONSTRAINT "astrology_report_requests_chart_request_id_chart_requests_id_fk" FOREIGN KEY ("chart_request_id") REFERENCES "public"."chart_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "astrology_report_results" ADD CONSTRAINT "astrology_report_results_request_id_astrology_report_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."astrology_report_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "astrology_report_results" ADD CONSTRAINT "astrology_report_results_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "astrology_report_requests_user_idx" ON "astrology_report_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "astrology_report_requests_chart_request_idx" ON "astrology_report_requests" USING btree ("chart_request_id");--> statement-breakpoint
CREATE INDEX "astrology_report_requests_status_idx" ON "astrology_report_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "astrology_report_results_request_idx" ON "astrology_report_results" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "astrology_report_results_user_idx" ON "astrology_report_results" USING btree ("user_id","created_at");