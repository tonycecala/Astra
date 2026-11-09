import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import postgres from "postgres";
import { resolveDatabaseUrl } from "@astra/db/src/env";

const target = new URL(resolveDatabaseUrl());
const path = resolve(process.argv[2] || `.astra-exports/backups/${new Date().toISOString().replace(/[:.]/g, "-")}.dump`);
await mkdir(dirname(path), { recursive: true, mode: 0o700 });
const executable = process.env.PG_DUMP_BIN || "pg_dump";
const client = postgres(target.toString(), { max: 1, prepare: false });
try {
  // Hold a consistent snapshot so fingerprints describe exactly the dumped data.
  await client.begin("isolation level repeatable read read only", async (tx) => {
    const [snapshot] = await tx`select pg_export_snapshot() as id`;
    const fingerprints: Record<string, { count: number; hash: string }> = {};
    for (const table of ["user", "app_user_profiles", "allies", "chart_requests", "chart_results", "astrology_report_requests", "astrology_report_results", "artifacts", "credit_ledger_entries"]) {
      const [row] = await tx.unsafe(`select count(*)::int as count, md5(coalesce(string_agg(md5(t::text), '' order by id), '')) as hash from "${table}" t`);
      fingerprints[table] = { count: row.count, hash: row.hash };
    }
    const dump = spawnSync(executable, ["--format=custom", "--no-owner", "--no-acl", "--snapshot", snapshot.id, "--file", path], {
      env: { ...process.env, PGHOST: target.hostname, PGPORT: target.port || "5432", PGDATABASE: target.pathname.slice(1), PGUSER: decodeURIComponent(target.username), PGPASSWORD: decodeURIComponent(target.password), PGSSLMODE: target.searchParams.get("sslmode") || "require" },
      encoding: "utf8"
    });
    if (dump.status !== 0) throw new Error(`Database backup failed. ${dump.stderr.replaceAll(target.toString(), "[database]")}`);
    await chmod(path, 0o600);
    const data = await readFile(path);
    const manifest = { createdAt: new Date().toISOString(), targetHash: createHash("sha256").update(`${target.hostname}${target.pathname}`).digest("hex"), sha256: createHash("sha256").update(data).digest("hex"), fingerprints };
    await writeFile(`${path}.json`, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    console.log(JSON.stringify({ backup: path, bytes: data.length, counts: Object.fromEntries(Object.entries(fingerprints).map(([name, value]) => [name, value.count])) }, null, 2));
  });
} finally {
  await client.end();
}
