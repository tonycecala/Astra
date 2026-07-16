const expectedAstraUrl = "https://alpha.astraportrait.com";
const errors: string[] = [];

function clean(name: string) {
  return process.env[name]?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function requireValue(name: string) {
  const value = clean(name);
  if (!value) errors.push(`${name} is required.`);
  return value;
}

const databaseUrl = requireValue("ASTRA_DATABASE_URL");
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (!parsed.protocol.startsWith("postgres")) errors.push("ASTRA_DATABASE_URL must be a PostgreSQL URL.");
    if (["127.0.0.1", "localhost"].includes(parsed.hostname)) errors.push("ASTRA_DATABASE_URL must point to the isolated Neon alpha database.");
  } catch {
    errors.push("ASTRA_DATABASE_URL is not a valid URL.");
  }
}

const astraUrl = requireValue("ASTRA_APP_BASE_URL");
if (astraUrl && astraUrl !== expectedAstraUrl) errors.push(`ASTRA_APP_BASE_URL must be ${expectedAstraUrl}.`);

const internalToken = requireValue("ASTRA_INTERNAL_API_TOKEN");
if (internalToken && internalToken.length < 32) errors.push("ASTRA_INTERNAL_API_TOKEN must be at least 32 characters.");

if (requireValue("COMPOSER_REQUIRE_AUTH") !== "1") errors.push("COMPOSER_REQUIRE_AUTH must be 1 for hosted Composer.");

if (errors.length) {
  console.error("Composer alpha environment is not ready:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Composer alpha environment contract passed. Secret values were not printed.");
