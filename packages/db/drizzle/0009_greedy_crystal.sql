CREATE TABLE "beta_feedback" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"report_request_id" text,
	"report_type" text NOT NULL,
	"rating" integer,
	"category" text DEFAULT 'report_quality' NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beta_feedback" ADD CONSTRAINT "beta_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beta_feedback" ADD CONSTRAINT "beta_feedback_report_request_id_astrology_report_requests_id_fk" FOREIGN KEY ("report_request_id") REFERENCES "public"."astrology_report_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "beta_feedback_user_idx" ON "beta_feedback" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "beta_feedback_report_idx" ON "beta_feedback" USING btree ("report_request_id","created_at");