import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, upsertAuthUserProfile } from "@astra/db";
import * as schema from "@astra/db";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";

type TestIdentity = {
  email: string;
  name: string;
};

type AuthenticatedContext = {
  context: BrowserContext;
  page: Page;
  userId: string;
};

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function testBaseUrl() {
  return clean(process.env.ASTRA_E2E_BASE_URL) || "http://localhost:3011";
}

function testAuthSecret() {
  return clean(process.env.BETTER_AUTH_SECRET) || "astra-clean-start-local-secret-change-me";
}

const testAuth = betterAuth({
  appName: "Astra E2E",
  baseURL: testBaseUrl(),
  secret: testAuthSecret(),
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
  plugins: [testUtils()]
});

async function createTestSession(input: TestIdentity) {
  const context = await testAuth.$context;
  const user = await context.test.saveUser(
    context.test.createUser({
      email: input.email,
      emailVerified: true,
      name: input.name
    })
  );

  await upsertAuthUserProfile(db, {
    displayName: input.name,
    email: input.email,
    userId: user.id
  });

  return {
    cookies: await context.test.getCookies({ userId: user.id, domain: "localhost" }),
    userId: user.id
  };
}

export async function signInWithTestSession(page: Page, input: TestIdentity) {
  const session = await createTestSession(input);
  await page.context().addCookies(session.cookies);
  await page.goto("/self");
  return session.userId;
}

export async function createAuthenticatedContext(
  browser: Browser,
  input: TestIdentity
): Promise<AuthenticatedContext> {
  const session = await createTestSession(input);
  const context = await browser.newContext({ baseURL: testBaseUrl() });
  await context.addCookies(session.cookies);
  const page = await context.newPage();
  await page.goto("/self");
  return {
    context,
    page,
    userId: session.userId
  };
}
