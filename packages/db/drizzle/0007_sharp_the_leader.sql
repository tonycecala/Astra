CREATE TABLE "astrology_report_shares" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"request_id" text NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "astrology_report_shares" ADD CONSTRAINT "astrology_report_shares_request_id_astrology_report_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."astrology_report_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "astrology_report_shares" ADD CONSTRAINT "astrology_report_shares_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "astrology_report_shares_request_idx" ON "astrology_report_shares" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "astrology_report_shares_token_hash_idx" ON "astrology_report_shares" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "astrology_report_shares_status_idx" ON "astrology_report_shares" USING btree ("status","created_at");