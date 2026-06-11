import { resolveDatabaseUrl } from "@astra/db/src/env";
import { assertResetAllowed } from "@astra/db/src/repositories";

const shouldExecute = process.argv.includes("--execute");
const databaseUrl = resolveDatabaseUrl();
const host = new URL(databaseUrl).hostname;

if (!shouldExecute) {
  console.log(`Local reset dry run: target host is ${host}. No database writes performed.`);
  console.log("Run npm run db:reset:local -- --execute only against a disposable local database.");
  process.exit(0);
}

assertResetAllowed(databaseUrl);
const { closeDatabaseConnection, db, resetFoundationData } = await import("@astra/db");
try {
  await resetFoundationData(db);
  console.log("Local foundation data reset complete. Run npm run db:migrate && npm run db:seed -- --execute next.");
} finally {
  await closeDatabaseConnection();
}
