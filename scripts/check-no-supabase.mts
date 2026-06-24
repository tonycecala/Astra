import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const forbidden = [
  /@supabase\//i,
  /supabase-js/i,
  /NEXT_PUBLIC_SUPABASE/i,
  /SUPABASE_/i,
  /service_role/i,
  /authenticated role/i,
  /row level security/i,
  /\bRLS\b/,
  /create policy/i,
  /alter policy/i
];
const ignored = new Set([".git", "node_modules", ".next", "dist", "playwright-report", "test-results"]);
const documentationPrefixes = ["akashic/", "docs/", "README.md", "AGENTS.md", "ASTRA_CLEAN_START_INAUGURAL_CHARTER.md"];
const allowedFiles = new Set([
  "scripts/check-no-supabase.mts",
  "scripts/check-foundation.mts",
  // One-off v1 quarry importer. This is not app runtime code and may name the legacy source envs it reads.
  "scripts/import-v1-astramaster-data.mts"
]);

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    if (entry.isFile()) files.push(path);
  }
  return files;
}

const offenders: string[] = [];
for (const file of await collectFiles(root)) {
  const relative = file.slice(root.length + 1);
  if (allowedFiles.has(relative)) continue;
  if (documentationPrefixes.some((prefix) => relative === prefix || relative.startsWith(prefix))) continue;
  const text = await readFile(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) offenders.push(`${relative} matches ${pattern}`);
  }
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const dependencyNames = [...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.devDependencies ?? {})];
for (const dependencyName of dependencyNames) {
  if (/supabase/i.test(dependencyName)) offenders.push(`package dependency is forbidden: ${dependencyName}`);
}

if (offenders.length) {
  throw new Error(`Forbidden legacy auth/database language found:\n${offenders.join("\n")}`);
}

console.log("No forbidden legacy auth/database carryover found.");
