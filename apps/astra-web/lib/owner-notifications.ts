import { randomUUID, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import type { AstraDb } from "@astra/db";

export type OwnerEmail = { to: string; subject: string; text: string; idempotencyKey: string };
type Delivery = (message: OwnerEmail) => Promise<void>;
type Activity = { id: string; kind: string; email: string; entity_id: string; occurred_at: Date; report_type: string | null; role: string | null };

export function authorizedNotificationJob(header: string | null, secret = process.env.CRON_SECRET) {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const supplied = Buffer.from(header);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function ownerNotificationConfig(env: Record<string, string | undefined> = process.env) {
  // Never let a Preview deployment send production owner notices.
  if (env.VERCEL_ENV !== "production") return null;
  const to = env.ASTRA_OWNER_NOTIFICATION_EMAIL?.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Valid owner notification email required.");
  return { to };
}

/** Claims one event at a time; a terminated invocation leaves a retryable lease. */
export async function deliverOwnerNotifications(database: AstraDb, to: string, send: Delivery, limit = 5) {
  let delivered = 0;
  let failed = 0;
  for (let index = 0; index < limit; index++) {
    const lease = randomUUID();
    const events = await database.execute<Activity>(sql`
      WITH candidate AS (
        SELECT id FROM owner_notifications
        WHERE delivered_at IS NULL AND available_at <= now()
        ORDER BY occurred_at, id FOR UPDATE SKIP LOCKED LIMIT 1
      ), claimed AS (
        UPDATE owner_notifications n SET lease_token = ${lease},
          available_at = now() + interval '5 minutes', attempts = attempts + 1
        FROM candidate c WHERE n.id = c.id RETURNING n.*
      )
      SELECT c.id, c.kind, c.entity_id, c.occurred_at, u.email, r.report_type, p.role
      FROM claimed c JOIN "user" u ON u.id = c.user_id
      LEFT JOIN app_user_profiles p ON p.user_id = c.user_id
      LEFT JOIN astrology_report_requests r ON c.kind = 'report' AND r.id = c.entity_id
    `);
    const event = events[0];
    if (!event) break;
    try {
      if (event.role === "admin" && event.kind !== "test") {
        await database.execute(sql`UPDATE owner_notifications SET delivered_at = now(), lease_token = NULL
          WHERE id = ${event.id} AND lease_token = ${lease}`);
        continue;
      }
      const report = event.kind === "report";
      const test = event.kind === "test";
      await send({
        to,
        subject: test ? "Astra: activity notification delivery test" : report ? "Astra: new customer report" : "Astra: customer login",
        text: [test ? "Your Astra activity notices are connected. Customer sign-ins and completed reports will be checked every five minutes." : report ? "A customer completed a report." : "A customer signed in to Astra.",
          `Account: ${event.email}`, `Time: ${new Date(event.occurred_at).toISOString()}`,
          ...(report ? [`Report type: ${event.report_type ?? "report"}`, `Report ID: ${event.entity_id}`] : []),
          "Admin: https://astraportrait.com/admin",
          "Private report content and birth details are not included in these notices."].join("\n"),
        idempotencyKey: `astra-owner/${event.id}`
      });
      await database.execute(sql`UPDATE owner_notifications SET delivered_at = now(), lease_token = NULL
        WHERE id = ${event.id} AND lease_token = ${lease}`);
      delivered++;
    } catch {
      // Do not log email addresses, report prose, credentials, or raw provider errors.
      console.error("Owner notification delivery failed; event retained for retry.", { eventId: event.id });
      await database.execute(sql`UPDATE owner_notifications SET lease_token = NULL,
        available_at = now() + interval '5 minutes' * least(attempts, 12)
        WHERE id = ${event.id} AND lease_token = ${lease}`);
      failed++;
    }
  }
  return { delivered, failed };
}
