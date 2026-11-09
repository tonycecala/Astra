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

  if (!value) {
    if (process.env.VERCEL_ENV === "production") throw new Error("Production database connection is required.");
    return "postgresql://astra:astra@127.0.0.1:5432/astra_clean_start";
  }
  if (process.env.VERCEL_ENV === "production") {
    const expected = cleanEnvValue(process.env.ASTRA_EXPECTED_DATABASE_TARGET);
    const target = new URL(value);
    if (!expected || `${target.hostname}${target.pathname}` !== expected) {
      throw new Error("Production database target does not match the protected live database identity.");
    }
  }
  assertNotLegacyDatabaseUrl(value);
  return value;
}

/** Destructive fixtures belong only in a disposable database on this machine. */
export function assertLocalDatabase(databaseUrl: string) {
  const host = new URL(databaseUrl).hostname;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    throw new Error("Refusing fixture/reset writes to a hosted database. Use reviewed additive migrations for live data.");
  }
  if (process.env.VERCEL_ENV) throw new Error("Fixture/reset writes are forbidden in Vercel environments.");
}
