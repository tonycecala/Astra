import { APIError, createAuthMiddleware } from "better-auth/api";
import { sql } from "drizzle-orm";
import type { AstraDb } from "@astra/db";
import { ui } from "../i18n";

export function signupCapError() {
  return new APIError("TOO_MANY_REQUESTS", { code: "ASTRA_SIGNUP_DAILY_LIMIT", message: ui.login.signupDailyLimit });
}

export function isSignupCapError(error: unknown): boolean {
  let current = error;
  const seen = new Set();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("message" in current && String(current.message).includes("ASTRA_SIGNUP_DAILY_LIMIT")) return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

/** Preserve adapter types and wrap transaction adapters as well as standalone creates. */
export function withSignupCapErrors<T extends object>(adapter: T): T {
  return new Proxy(adapter, {
    get(target, property, receiver) {
      const method: unknown = Reflect.get(target, property, receiver);
      if ((property !== "create" && property !== "transaction") || typeof method !== "function") return method;
      return async (...args: unknown[]) => {
        if (property === "transaction" && typeof args[0] === "function") {
          const callback = args[0];
          args[0] = (transaction: object) => Reflect.apply(callback, undefined, [withSignupCapErrors(transaction)]);
        }
        try {
          return await Reflect.apply(method, target, args);
        } catch (error) {
          if (isSignupCapError(error)) throw signupCapError();
          throw error;
        }
      };
    }
  });
}

/** A helpful early message, not a reservation. The database trigger owns the atomic limit. */
export async function assertSignupAvailable(database: AstraDb, email: string) {
  const rows = await database.execute<{ existing: boolean; full: boolean }>(sql`
    SELECT EXISTS(SELECT 1 FROM "user" WHERE lower(email) = ${email.trim().toLowerCase()}) AS existing,
      (SELECT count(*) FROM daily_signup_slots s
       WHERE s.signup_day = (now() AT TIME ZONE p.time_zone)::date) >= p.daily_limit AS full
    FROM signup_policy p WHERE p.id = 'public-alpha'
  `);
  if (!rows[0]) throw new Error("Signup policy is not configured.");
  if (!rows[0].existing && rows[0].full) throw signupCapError();
}

export function signupCapBeforeHook(database: AstraDb) {
  return createAuthMiddleware(async (context) => {
    const body: unknown = context.body;
    if (!body || typeof body !== "object" || !("email" in body) || typeof body.email !== "string") return;
    const sendingSignInCode = context.path === "/email-otp/send-verification-otp" && "type" in body && body.type === "sign-in";
    if (sendingSignInCode || context.path === "/sign-up/email") await assertSignupAvailable(database, body.email);
  });
}
