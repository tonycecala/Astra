import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { emailOTP } from "better-auth/plugins";
import { closeDatabaseConnection, db } from "@astra/db";
import * as schema from "@astra/db";
import { assertLocalDatabase, resolveDatabaseUrl } from "@astra/db/src/env";
import { withSignupCapErrors } from "../apps/astra-web/lib/auth/signup-cap";

assertLocalDatabase(resolveDatabaseUrl());
assert.match(new URL(resolveDatabaseUrl()).pathname, /signup_cap_validation/);
const fixtureIds: string[] = [];
const create = async (name: string) => {
  const id = randomUUID(); fixtureIds.push(id);
  await db.execute(sql`insert into "user" (id,name,email,email_verified) values (${id}, ${name}, ${id + '@example.com'},true)`);
  return id;
};
try {
  const baselineUsers = Number((await db.execute(sql`select count(*)::int as count from "user"`))[0].count);
  await db.execute(sql`delete from daily_signup_slots`);
  const rollback = randomUUID();
  await assert.rejects(db.transaction(async (tx) => {
    await tx.execute(sql`insert into "user" (id,name,email) values (${rollback},'rollback',${rollback + '@example.com'})`);
    throw new Error('cancel fixture');
  }));
  assert.equal((await db.execute(sql`select id from daily_signup_slots`)).length, 0, "Failed transactions do not consume a place.");
  const existingId = await create('existing tester');
  const raced = await Promise.allSettled(Array.from({ length: 20 }, () => create('concurrent signup')));
  assert.equal(raced.filter((row) => row.status === 'fulfilled').length, 4, "Exactly five total accounts fit, including the existing fixture.");
  assert.equal((await db.execute(sql`select id from daily_signup_slots`)).length, 5);
  const otpCodes = new Map<string,string>();
  const auth = betterAuth({
    baseURL: 'http://localhost:3021', secret: 'isolated-signup-cap-validation-secret',
    database: (options: BetterAuthOptions) => withSignupCapErrors(drizzleAdapter(db, { provider: 'pg', schema, transaction: true })(options)),
    emailAndPassword: { enabled: true },
    plugins: [emailOTP({ async sendVerificationOTP({email,otp}) {
      otpCodes.set(email,otp);
    } })]
  });
  const post = async (path:string,body:object) => auth.handler(new Request('http://localhost:3021/api/auth'+path, {
    method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:3021'},body:JSON.stringify(body)
  }));
  const newEmail = randomUUID()+'@example.com';
  const unavailable = await post('/email-otp/send-verification-otp',{email:newEmail,type:'sign-in'});
  assert.equal(unavailable.status,200, 'Code requests do not expose account membership when full.');
  const blockedVerification = await post('/sign-in/email-otp',{email:newEmail,otp:otpCodes.get(newEmail)});
  assert.equal(blockedVerification.status,429);
  assert.equal((await blockedVerification.json()).code,'ASTRA_SIGNUP_DAILY_LIMIT');
  const passwordSignup = await post('/sign-up/email',{name:'blocked',email:newEmail,password:'isolated-password-12345'});
  assert.equal(passwordSignup.status,429, "Password signup cannot bypass the database cap.");
  const authContext = await auth.$context;
  await assert.rejects(authContext.internalAdapter.createUser({name:'adapter bypass',email:randomUUID()+'@example.com',emailVerified:true}),
    (error: unknown) => !!error && typeof error === 'object' && 'status' in error && error.status === 'TOO_MANY_REQUESTS', "Adapter errors become a helpful 429.");
  await assert.rejects(authContext.adapter.transaction(async (transaction) => transaction.create({model:'user',data:{name:'transaction bypass',email:randomUUID()+'@example.com',emailVerified:true,createdAt:new Date(),updatedAt:new Date()}})),
    (error: unknown) => !!error && typeof error === 'object' && 'status' in error && error.status === 'TOO_MANY_REQUESTS', "Transaction adapters preserve cap error translation.");
  const existingEmail = existingId+'@example.com';
  assert.equal((await post('/email-otp/send-verification-otp',{email:existingEmail,type:'sign-in'})).status,200);
  const signIn = await post('/sign-in/email-otp',{email:existingEmail,otp:otpCodes.get(existingEmail)});
  assert.equal(signIn.status,200, "Existing testers can finish sign-in at capacity.");
  assert.ok(signIn.headers.get('set-cookie'));
  const before = (await db.execute(sql`select count(*)::int as count from "user"`))[0].count;
  assert.equal(Number(before),baselineUsers+5,"Rejected requests leave no account behind.");
  const removed = raced.find((row) => row.status === 'fulfilled');
  if (removed?.status === 'fulfilled') await db.execute(sql`delete from "user" where id=${removed.value}`);
  await assert.rejects(create('delete bypass'));
  assert.equal((await db.execute(sql`select id from daily_signup_slots`)).length,5,"Deletion does not refund daily capacity.");
  const dates = await db.execute(sql`select
    ('2026-11-10T05:59:59Z'::timestamptz at time zone 'America/Chicago')::date::text as before_midnight,
    ('2026-11-10T06:00:00Z'::timestamptz at time zone 'America/Chicago')::date::text as after_midnight,
    ('2026-03-09T04:59:59Z'::timestamptz at time zone 'America/Chicago')::date::text as dst_before,
    ('2026-03-09T05:00:00Z'::timestamptz at time zone 'America/Chicago')::date::text as dst_after`);
  assert.deepEqual({...dates[0]}, {before_midnight:'2026-11-09',after_midnight:'2026-11-10',dst_before:'2026-03-08',dst_after:'2026-03-09'});
  await db.execute(sql`delete from daily_signup_slots`);
  await db.execute(sql`insert into daily_signup_slots (id,signup_day,slot,user_id) select 'yesterday:'||i, (now() at time zone 'America/Chicago')::date-1, i,'old:'||i from generate_series(1,5) i`);
  await create('next day');
  assert.equal((await db.execute(sql`select id from daily_signup_slots`)).length,6,"Prior-day occupancy does not consume current-day capacity.");
  const raceEmail = randomUUID()+'@example.com';
  assert.equal((await post('/email-otp/send-verification-otp',{email:raceEmail,type:'sign-in'})).status,200);
  await Promise.all(Array.from({length:4},()=>create('last places')));
  const lateVerification = await post('/sign-in/email-otp',{email:raceEmail,otp:otpCodes.get(raceEmail)});
  assert.equal(lateVerification.status,429,"A code issued before capacity cannot create a sixth account after capacity.");
  assert.equal((await lateVerification.json()).code,'ASTRA_SIGNUP_DAILY_LIMIT');
  console.log('Daily cap: concurrency, rollback, OTP and password paths, existing login, deletion resistance, Central midnight, DST and day rollover passed.');
} finally {
  for(const id of fixtureIds) await db.execute(sql`delete from "user" where id=${id}`);
  await db.execute(sql`delete from daily_signup_slots`);
  await closeDatabaseConnection();
}
