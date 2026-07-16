const email = process.argv.find((argument) => argument.includes("@"))?.trim().toLowerCase();
const shouldExecute = process.argv.includes("--execute");

if (!email) {
  throw new Error("Provide the signed-in alpha email address to promote.");
}

if (!shouldExecute) {
  console.log(`Admin promotion dry run for ${email}. No database writes performed.`);
  console.log(`Re-run with --execute after confirming ASTRA_DATABASE_URL targets the isolated alpha database.`);
  process.exit(0);
}

const { adminUpdateUserRole, closeDatabaseConnection, db, resolveDatabaseUrl } = await import("@astra/db");
const databaseUrl = new URL(resolveDatabaseUrl());
if (["127.0.0.1", "localhost"].includes(databaseUrl.hostname)) {
  throw new Error("Admin promotion refused: ASTRA_DATABASE_URL points to a local database.");
}
if (process.env.ASTRA_ALPHA_ADMIN_CONFIRM !== "alpha.astraportrait.com") {
  throw new Error("Admin promotion refused: set ASTRA_ALPHA_ADMIN_CONFIRM=alpha.astraportrait.com after confirming the target database.");
}

try {
  const profile = await adminUpdateUserRole(db, { targetEmail: email, role: "admin" });
  console.log(`Promoted ${profile.email} to admin in the configured database.`);
} finally {
  await closeDatabaseConnection();
}
