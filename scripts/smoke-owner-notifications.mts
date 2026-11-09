import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { closeDatabaseConnection, db } from "@astra/db";
import { assertLocalDatabase, resolveDatabaseUrl } from "@astra/db/src/env";
import { assertResetAllowed, resetFoundationData, seedFoundationData } from "@astra/db/src/repositories";
import { authorizedNotificationJob, deliverOwnerNotifications, ownerNotificationConfig, type OwnerEmail } from "../apps/astra-web/lib/owner-notifications";

assertLocalDatabase(resolveDatabaseUrl());
assert.match(new URL(resolveDatabaseUrl()).pathname, /safety_validation/, "Use an isolated restored database, never the working local database.");
assert.equal(authorizedNotificationJob(null, "secret"), false);
assert.equal(authorizedNotificationJob("Bearer wrong", "secret"), false);
assert.equal(authorizedNotificationJob("Bearer secret", "secret"), true);
assert.equal(ownerNotificationConfig({ VERCEL_ENV: "preview", ASTRA_OWNER_NOTIFICATION_EMAIL: "owner@example.com" }), null);
assert.throws(() => ownerNotificationConfig({ VERCEL_ENV: "production" }));
assert.throws(() => assertResetAllowed("postgresql://user:pass@live.neon.tech/production"));
process.env.ASTRA_ALLOW_DB_RESET = "1";
assert.throws(() => assertResetAllowed("postgresql://user:pass@live.neon.tech/production"));
delete process.env.ASTRA_ALLOW_DB_RESET;
const original = process.env.ASTRA_DATABASE_URL;
process.env.VERCEL_ENV = "production";
process.env.ASTRA_EXPECTED_DATABASE_TARGET = "protected.neon.tech/production";
assert.throws(() => resolveDatabaseUrl(), /protected live database identity/);
delete process.env.VERCEL_ENV;
delete process.env.ASTRA_EXPECTED_DATABASE_TARGET;
process.env.ASTRA_DATABASE_URL = "postgresql://user:pass@live.neon.tech/production";
await assert.rejects(seedFoundationData(db), /hosted/);
await assert.rejects(resetFoundationData(db), /hosted/);
process.env.ASTRA_DATABASE_URL = original;

const id = randomUUID();
const email = `notification-${id}@example.com`;
try {
  const counts = await db.execute(sql`select (select count(*) from "user") as users, (select count(*) from astrology_report_results) as reports, (select count(*) from allies) as allies`);
  if (process.env.ASTRA_EXPECT_RESTORED_REPORTS) assert.equal(Number(counts[0].reports), Number(process.env.ASTRA_EXPECT_RESTORED_REPORTS), "Restored alpha report count must match the backup.");
  await db.execute(sql`insert into "user" (id, name, email) values (${id}, 'Notification fixture', ${email})`);
  await db.execute(sql`insert into "session" (id, token, expires_at, user_id) values (${id}, ${id}, now() + interval '1 hour', ${id})`);
  await db.execute(sql`insert into astrology_report_requests (id, user_id, report_type, subject_name, birth_data) values (${id}, ${id}, 'identity', 'Private fixture', '{"private":"must not be emailed"}'::jsonb)`);
  await db.execute(sql`insert into astrology_report_results (id, request_id, user_id, engine, engine_version, status, summary) values (${id}, ${id}, ${id}, 'fixture', '1', 'failed', 'PRIVATE REPORT PROSE')`);
  assert.equal((await db.execute(sql`select id from owner_notifications where user_id = ${id}`)).length, 1, "Failed reports do not notify.");
  await db.execute(sql`update astrology_report_results set status='completed' where id=${id}`);
  await db.execute(sql`update astrology_report_results set status='completed' where id=${id}`);
  await db.execute(sql`delete from "session" where id=${id}`);
  assert.equal((await db.execute(sql`select id from owner_notifications where user_id = ${id}`)).length, 2, "One login and one report, retained after sign-out.");
  const messages: OwnerEmail[] = [];
  const send = async (message: OwnerEmail) => { messages.push(message); };
  const runs = await Promise.all([deliverOwnerNotifications(db, 'owner@example.com', send), deliverOwnerNotifications(db, 'owner@example.com', send)]);
  assert.equal(runs.reduce((sum, run) => sum + run.delivered, 0), 2);
  assert.equal(messages.length, 2, "Concurrent cron calls cannot claim the same event.");
  assert.ok(messages.every((message) => !message.text.includes('PRIVATE REPORT PROSE') && !message.text.includes('must not be emailed')));
  assert.equal((await deliverOwnerNotifications(db, 'owner@example.com', send)).delivered, 0);
  await db.execute(sql`insert into "session" (id, token, expires_at, user_id) values (${id}, ${id}, now() + interval '1 hour', ${id})`);
  // Simulate an invocation dying after claiming the event; its expired lease must recover.
  await db.execute(sql`update owner_notifications set delivered_at = null, available_at = now() - interval '1 minute', lease_token = 'expired' where id = ${'login:' + id}`);
  const failure = await deliverOwnerNotifications(db, 'owner@example.com', async () => { throw new Error('simulated outage'); });
  assert.equal(failure.failed, 1);
  assert.equal((await deliverOwnerNotifications(db, 'owner@example.com', send)).delivered, 0, "Backoff is respected.");
  await db.execute(sql`update owner_notifications set available_at = now() - interval '1 minute' where id = ${'login:' + id}`);
  assert.equal((await deliverOwnerNotifications(db, 'owner@example.com', send)).delivered, 1, "Retry recovers delivery.");
  await db.execute(sql`insert into app_user_profiles (id, user_id, email, display_name, role) values (${id}, ${id}, ${email}, 'Fixture admin', 'admin')`);
  const adminSession = randomUUID();
  await db.execute(sql`insert into "session" (id, token, expires_at, user_id) values (${adminSession}, ${adminSession}, now() + interval '1 hour', ${id})`);
  const beforeAdmin = messages.length;
  await deliverOwnerNotifications(db, 'owner@example.com', send);
  assert.equal(messages.length, beforeAdmin, "Admin sign-ins do not send customer alerts.");
  const rolledBack = randomUUID();
  await assert.rejects(db.transaction(async (tx) => {
    await tx.execute(sql`insert into "session" (id, token, expires_at, user_id) values (${rolledBack}, ${rolledBack}, now() + interval '1 hour', ${id})`);
    throw new Error('rollback fixture');
  }));
  assert.equal((await db.execute(sql`select id from owner_notifications where id=${'login:' + rolledBack}`)).length, 0, "Rolled-back sign-ins never notify.");
  console.log("Backup data preserved; login/report triggers, deduplication, concurrent leases, retry, preview isolation, privacy, and hosted reset/seed refusal passed.");
} finally {
  await db.execute(sql`delete from "user" where id=${id}`);
  await closeDatabaseConnection();
}
