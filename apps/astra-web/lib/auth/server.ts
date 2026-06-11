import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { headers } from "next/headers";
import { db } from "@astra/db";
import * as schema from "@astra/db";
import { sendEmail } from "../email/send-email";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function authBaseUrl() {
  const vercelUrl = clean(process.env.VERCEL_BRANCH_URL) || clean(process.env.VERCEL_URL);
  return clean(process.env.BETTER_AUTH_URL) || clean(process.env.NEXT_PUBLIC_SITE_URL) || (vercelUrl ? `https://${vercelUrl}` : "") || "http://localhost:3011";
}

function authSecret() {
  const secret = clean(process.env.BETTER_AUTH_SECRET);
  if (secret) return secret;
  if (!process.env.VERCEL_ENV) return "astra-clean-start-local-secret-change-me";
  throw new Error("BETTER_AUTH_SECRET is required outside local development.");
}

function otpSubject(type: "sign-in" | "email-verification" | "forget-password" | "change-email") {
  if (type === "email-verification") return "Your Astra confirmation code";
  if (type === "forget-password") return "Your Astra password reset code";
  if (type === "change-email") return "Your Astra email change code";
  return "Your Astra sign-in code";
}

export const auth = betterAuth({
  appName: "Astra",
  baseURL: authBaseUrl(),
  secret: authSecret(),
  advanced: {
    database: {
      generateId: "uuid"
    }
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: true
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 10 * 60,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendEmail({
          to: email,
          subject: otpSubject(type),
          text: `Your Astra code is ${otp}. It expires in 10 minutes.`
        });
      }
    })
  ]
});

export async function getAstraSession(requestHeaders?: Headers) {
  return auth.api.getSession({
    headers: requestHeaders ?? (await headers())
  });
}
