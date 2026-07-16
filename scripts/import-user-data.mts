import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { portableUserDataBundleSchema } from "@astra/contracts";
import {
  closeDatabaseConnection,
  db,
  importPortableUserData,
  previewPortableUserDataImport,
  resolveDatabaseUrl
} from "@astra/db";

const inputPath = option("--input");
const targetEmail = option("--target-email")?.trim().toLowerCase();
const shouldExecute = process.argv.includes("--execute");
const confirmation = option("--confirm");

if (!inputPath) throw new Error("Provide --input for the portable JSON bundle.");
if (!targetEmail) throw new Error("Provide --target-email for an existing Better Auth account.");

const databaseUrl = new URL(resolveDatabaseUrl());
const databaseName = databaseUrl.pathname.replace(/^\//, "") || "default";
const targetFingerprint = `${databaseUrl.hostname}/${databaseName}`;
const bundle = portableUserDataBundleSchema.parse(JSON.parse(await readFile(resolve(inputPath), "utf8")));

try {
  const preview = await previewPortableUserDataImport(db, { bundle, targetEmail });
  console.log(`Target database: ${targetFingerprint}`);
  console.log(`Target account: ${preview.targetEmail}`);
  console.log(JSON.stringify({ counts: preview.counts, creates: preview.creates, updates: preview.updates }, null, 2));

  if (!shouldExecute) {
    console.log("Dry run only. No database writes performed.");
    console.log(`Re-run with --execute --confirm '${targetFingerprint}' after reviewing this preview.`);
    process.exitCode = 0;
  } else {
    if (confirmation !== targetFingerprint) {
      throw new Error(`Import refused. Pass --confirm '${targetFingerprint}' to acknowledge the exact target database.`);
    }
    await importPortableUserData(db, { bundle, targetEmail });
    console.log("Portable Astra user data imported successfully.");
  }
} finally {
  await closeDatabaseConnection();
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
