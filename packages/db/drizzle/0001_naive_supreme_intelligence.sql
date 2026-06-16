CREATE TABLE "chart_requests" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"subject_name" text NOT NULL,
	"birth_data" jsonb NOT NULL,
	"question" text,
	"intent" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text DEFAULT 'self' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chart_results" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"request_id" text NOT NULL,
	"user_id" text NOT NULL,
	"engine" text NOT NULL,
	"status" text NOT NULL,
	"summary" text,
	"chart_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chart_requests" ADD CONSTRAINT "chart_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_results" ADD CONSTRAINT "chart_results_request_id_chart_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."chart_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_results" ADD CONSTRAINT "chart_results_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chart_requests_user_idx" ON "chart_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "chart_requests_status_idx" ON "chart_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "chart_results_request_idx" ON "chart_results" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "chart_results_user_idx" ON "chart_results" USING btree ("user_id","created_at");