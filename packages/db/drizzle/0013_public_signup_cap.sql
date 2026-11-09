CREATE TABLE "daily_signup_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"signup_day" date NOT NULL,
	"slot" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signup_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"daily_limit" integer NOT NULL,
	"time_zone" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "daily_signup_slots_day_slot_idx" ON "daily_signup_slots" USING btree ("signup_day","slot");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_signup_slots_user_idx" ON "daily_signup_slots" USING btree ("user_id");
--> statement-breakpoint
INSERT INTO signup_policy (id, daily_limit, time_zone) VALUES ('public-alpha', 5, 'America/Chicago');
--> statement-breakpoint
LOCK TABLE "user" IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
INSERT INTO daily_signup_slots (id, signup_day, slot, user_id)
SELECT ((now() AT TIME ZONE 'America/Chicago')::date)::text || ':' || row_number() OVER (ORDER BY created_at, id),
  (now() AT TIME ZONE 'America/Chicago')::date,
  row_number() OVER (ORDER BY created_at, id)::integer, id
FROM "user"
WHERE (created_at AT TIME ZONE 'America/Chicago')::date = (now() AT TIME ZONE 'America/Chicago')::date;
--> statement-breakpoint
CREATE FUNCTION astra_enforce_daily_signup_cap() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  policy signup_policy%ROWTYPE;
  today date;
  candidate integer;
  reserved integer;
BEGIN
  SELECT * INTO STRICT policy FROM signup_policy WHERE id = 'public-alpha';
  today := (now() AT TIME ZONE policy.time_zone)::date;
  FOR candidate IN 1..policy.daily_limit LOOP
    INSERT INTO daily_signup_slots (id, signup_day, slot, user_id)
      VALUES (today::text || ':' || candidate, today, candidate, NEW.id)
      ON CONFLICT DO NOTHING RETURNING slot INTO reserved;
    IF FOUND THEN RETURN NEW; END IF;
  END LOOP;
  RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ASTRA_SIGNUP_DAILY_LIMIT';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER astra_daily_signup_cap AFTER INSERT ON "user"
FOR EACH ROW EXECUTE FUNCTION astra_enforce_daily_signup_cap();
