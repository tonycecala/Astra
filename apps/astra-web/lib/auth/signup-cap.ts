import { APIError } from "better-auth/api";
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
