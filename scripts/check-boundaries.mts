import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", ".next", "node_modules", "dist", "playwright-report", "test-results"]);
const sourceExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);

type Violation = {
  file: string;
  importPath: string;
  reason: string;
};

function hasSourceExtension(file: string) {
  return [...sourceExtensions].some((extension) => file.endsWith(extension));
}

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectSourceFiles(path)));
    if (entry.isFile() && hasSourceExtension(entry.name)) files.push(path);
  }

  return files;
}

function extractImportSpecifiers(source: string) {
  const specifiers = new Set<string>();
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:type\s+)?[^'"]*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) specifiers.add(match[1]);
    }
  }

  return [...specifiers];
}

function ownerOf(file: string) {
  const normalized = file.split("\\").join("/");
  if (normalized.startsWith("apps/astra-web/")) return "apps/astra-web";
  if (normalized.startsWith("apps/composer-web/")) return "apps/composer-web";
  if (normalized.startsWith("packages/")) return "packages";
  return "other";
}

function boundaryViolation(file: string, importPath: string): Violation | null {
  const owner = ownerOf(file);

  if (file.startsWith("packages/chart-maker/") && /(?:@astra\/db|packages\/db|apps\/)/.test(importPath)) {
    return { file, importPath, reason: "Chart maker must not import Astra app or database internals." };
  }

  if (owner === "apps/astra-web" && /(?:^|\/)apps\/composer-web(?:\/|$)/.test(importPath)) {
    return { file, importPath, reason: "Astra must not import Composer internals." };
  }

  if (owner === "apps/composer-web" && /(?:^|\/)apps\/astra-web(?:\/|$)/.test(importPath)) {
    return { file, importPath, reason: "Composer must not import Astra app internals." };
  }

  if (owner === "packages" && /(?:^|\/)apps\//.test(importPath)) {
    return { file, importPath, reason: "Packages must not import app code." };
  }

  return null;
}

const violations: Violation[] = [];
for (const absoluteFile of await collectSourceFiles(root)) {
  const file = relative(root, absoluteFile);
  const source = await readFile(absoluteFile, "utf8");

  for (const specifier of extractImportSpecifiers(source)) {
    const violation = boundaryViolation(file, specifier);
    if (violation) violations.push(violation);
  }
}

if (violations.length) {
  throw new Error(
    `Dependency boundary violations found:\n${violations
      .map((violation) => `${violation.file} imports ${violation.importPath}: ${violation.reason}`)
      .join("\n")}`
  );
}

console.log("Dependency boundary checks passed.");
