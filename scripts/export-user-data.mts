import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { closeDatabaseConnection, db, exportPortableUserData } from "@astra/db";

const email = option("--email")?.trim().toLowerCase();
const output = option("--output");
const sourceLabel = option("--source-label")?.trim() || "local";

if (!email) throw new Error("Provide --email for the Astra account to export.");
if (!output) throw new Error("Provide --output for the private JSON bundle.");

const outputPath = resolve(output);
try {
  const bundle = await exportPortableUserData(db, { email, sourceLabel });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(bundle, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await chmod(outputPath, 0o600);
  console.log(`Exported ${email} to ${outputPath}.`);
  console.log(JSON.stringify(bundleCounts(bundle), null, 2));
} finally {
  await closeDatabaseConnection();
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function bundleCounts(bundle: Awaited<ReturnType<typeof exportPortableUserData>>) {
  return Object.fromEntries(Object.entries(bundle.data).map(([key, value]) => [key, value.length]));
}
