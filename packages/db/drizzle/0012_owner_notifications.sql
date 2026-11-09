CREATE TABLE "owner_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"user_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_token" text
);
--> statement-breakpoint
ALTER TABLE "owner_notifications" ADD CONSTRAINT "owner_notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "owner_notifications_pending_idx" ON "owner_notifications" USING btree ("delivered_at","available_at");
--> statement-breakpoint
CREATE FUNCTION astra_queue_owner_activity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'session' THEN
    INSERT INTO owner_notifications (id, kind, user_id, entity_id)
    VALUES ('login:' || NEW.id, 'login', NEW.user_id, NEW.id)
    ON CONFLICT (id) DO NOTHING;
  ELSIF NEW.status = 'completed' THEN
    INSERT INTO owner_notifications (id, kind, user_id, entity_id)
    VALUES ('report:' || NEW.request_id, 'report', NEW.user_id, NEW.request_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER astra_owner_login AFTER INSERT ON "session"
FOR EACH ROW EXECUTE FUNCTION astra_queue_owner_activity();
--> statement-breakpoint
CREATE TRIGGER astra_owner_report AFTER INSERT OR UPDATE OF status ON astrology_report_results
FOR EACH ROW EXECUTE FUNCTION astra_queue_owner_activity();
