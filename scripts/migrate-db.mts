import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolveDatabaseUrl } from "@astra/db/src/env";
import postgres from "postgres";

const url = resolveDatabaseUrl();
const target = new URL(url);
const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
if (process.env.VERCEL_ENV) throw new Error("Database migrations must never run during Vercel builds or runtime.");
if (!local) {
  const identity = `${target.hostname}${target.pathname}`;
  if (process.env.ASTRA_LIVE_MIGRATION_CONFIRM !== identity) {
    throw new Error("Hosted migration refused. Set ASTRA_LIVE_MIGRATION_CONFIRM to the exact host/database after reviewing the pending migration and making a backup.");
  }
  const path = process.env.ASTRA_LIVE_BACKUP_PATH;
  if (!path) throw new Error("ASTRA_LIVE_BACKUP_PATH is required for hosted migrations.");
  const backup = await stat(path);
  if (!backup.isFile() || !backup.size || Date.now() - backup.mtimeMs > 86_400_000) {
    throw new Error("Hosted migration requires a nonempty database backup made within 24 hours.");
  }
  const manifest = JSON.parse(await readFile(`${path}.json`, "utf8"));
  const targetHash = createHash("sha256").update(identity).digest("hex");
  const backupHash = createHash("sha256").update(await readFile(path)).digest("hex");
  if (manifest.targetHash !== targetHash || manifest.sha256 !== backupHash) {
    throw new Error("Backup manifest does not match this database and archive. Run db:backup first.");
  }
  const journal = JSON.parse(await readFile("packages/db/drizzle/meta/_journal.json", "utf8")) as { entries: { when: number; tag: string }[] };
  const client = postgres(url, { max: 1, prepare: false });
  try {
    const [row] = await client`select max(created_at) as latest from drizzle.__drizzle_migrations`;
    const pending = journal.entries.filter((entry) => entry.when > Number(row.latest ?? 0));
    for (const entry of pending) {
      const migration = await readFile(`packages/db/drizzle/${entry.tag}.sql`, "utf8");
      const withoutComments = migration.replace(/--[^\n]*/g, "");
      if (/\b(?:DROP|TRUNCATE|DELETE\s+FROM)\b|\bUPDATE\s+[^;]+\sSET\b|\bALTER\s+COLUMN\b/i.test(withoutComments)) {
        throw new Error(`Hosted migration ${entry.tag} needs a separate data-preservation review; destructive/data-rewriting SQL is blocked by this runner.`);
      }
    }
    console.log(`Reviewed ${pending.length} pending additive migrations; backup present. Customer rows are not reseeded.`);
  } finally {
    await client.end();
  }
}
const result = spawnSync(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "migrate", "--config", "packages/db/drizzle.config.ts"], {
  stdio: "inherit", env: { ...process.env, ASTRA_DATABASE_URL: url }
});
process.exit(result.status ?? 1);
