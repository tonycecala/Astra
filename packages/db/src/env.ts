function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function assertNotLegacyDatabaseUrl(value: string) {
  const url = new URL(value);
  if (url.hostname.includes("supabase.co") || url.hostname.includes("supabase.com")) {
    throw new Error("Astra Clean Start refuses legacy Supabase database URLs.");
  }
}

export function resolveDatabaseUrl() {
  const value =
    cleanEnvValue(process.env.ASTRA_DATABASE_URL) ||
    cleanEnvValue(process.env.POSTGRES_URL_NON_POOLING) ||
    cleanEnvValue(process.env.DATABASE_URL_UNPOOLED) ||
    cleanEnvValue(process.env.POSTGRES_URL) ||
    cleanEnvValue(process.env.DATABASE_URL);

  if (!value) return "postgresql://astra:astra@127.0.0.1:5432/astra_clean_start";
  assertNotLegacyDatabaseUrl(value);
  return value;
}
