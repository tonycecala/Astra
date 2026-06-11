import { defineConfig } from "drizzle-kit";

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function isForbiddenLegacyDatabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.includes("supabase.co") || url.hostname.includes("supabase.com");
  } catch {
    return false;
  }
}

function databaseUrl() {
  const candidates = [
    process.env.ASTRA_DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL
  ];

  for (const candidate of candidates) {
    const value = cleanEnvValue(candidate);
    if (!value) continue;
    if (isForbiddenLegacyDatabaseUrl(value)) {
      throw new Error("Astra Clean Start refuses legacy Supabase database URLs.");
    }
    return value;
  }

  return "postgresql://astra:astra@127.0.0.1:5432/astra_clean_start";
}

export default defineConfig({
  schema: "./packages/db/src/schema.ts",
  out: "./packages/db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl()
  },
  strict: true,
  verbose: true
});
