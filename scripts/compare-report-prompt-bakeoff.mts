import { chmod, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

type Metrics = {
  totalWords?: number;
  fleschKincaidGrade?: number;
  wallClockMs?: number;
  estimatedSpend?: number;
  inputTokens?: number;
  outputTokens?: number;
  specificityPerThousandWords?: number;
  practicalSentences?: number;
};

type RecordSummary = {
  family: string;
  status: string;
  error?: string;
  metrics: Metrics;
};

const root = resolve(option("--root") || ".astra-exports/comparisons/2026-07-17-tony-prompt-contract-bakeoff");
const before = await readJson<RecordSummary[]>(join(root, "before", "telemetry.json"));
const after = await readJson<RecordSummary[]>(join(root, "after", "telemetry.json"));
const beforeManifest = await readJson<Record<string, unknown>>(join(root, "before", "manifest.json"));
const afterManifest = await readJson<Record<string, unknown>>(join(root, "after", "manifest.json"));
const familyOrder = ["welcome", "identity", "core", "deep", "progressed", "synastry"];

const rows = familyOrder.map((family) => {
  const left = before.find((record) => record.family === family);
  const right = after.find((record) => record.family === family);
  if (!left || !right) throw new Error(`Missing ${family} from the comparison bundle.`);
  return { family, before: left, after: right };
});

const summary = {
  generatedAt: new Date().toISOString(),
  beforePromptVersion: beforeManifest.promptVersion,
  afterPromptVersion: afterManifest.promptVersion,
  beforeCompletedSpend: sum(before.filter((record) => record.status === "completed").map((record) => record.metrics.estimatedSpend)),
  afterCompletedSpend: sum(after.filter((record) => record.status === "completed").map((record) => record.metrics.estimatedSpend)),
  beforeWallClockMs: sum(before.map((record) => record.metrics.wallClockMs)),
  afterWallClockMs: sum(after.map((record) => record.metrics.wallClockMs)),
  rows
};

await writePrivate(join(root, "metric-comparison.json"), `${JSON.stringify(summary, null, 2)}\n`);
await writePrivate(join(root, "metric-comparison.md"), comparisonMarkdown(summary));
console.log(JSON.stringify({ ok: true, root, beforePromptVersion: summary.beforePromptVersion, afterPromptVersion: summary.afterPromptVersion }, null, 2));

function comparisonMarkdown(input: typeof summary) {
  const lines = [
    "# Astra Prompt Contract Metric Comparison",
    "",
    `Before: \`${String(input.beforePromptVersion)}\`  `,
    `After: \`${String(input.afterPromptVersion)}\``,
    "",
    "| Family | Status before -> after | Words | Grade | Seconds | Cost | Specificity / 1k | Practical sentences |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];
  for (const row of input.rows) {
    lines.push(`| ${title(row.family)} | ${row.before.status} -> ${row.after.status} | ${pair(row.before.metrics.totalWords, row.after.metrics.totalWords)} | ${pair(row.before.metrics.fleschKincaidGrade, row.after.metrics.fleschKincaidGrade)} | ${pair(seconds(row.before.metrics.wallClockMs), seconds(row.after.metrics.wallClockMs))} | ${moneyPair(row.before.metrics.estimatedSpend, row.after.metrics.estimatedSpend)} | ${pair(row.before.metrics.specificityPerThousandWords, row.after.metrics.specificityPerThousandWords)} | ${pair(row.before.metrics.practicalSentences, row.after.metrics.practicalSentences)} |`);
  }
  lines.push(
    "",
    "## Totals",
    "",
    `- Before completed-report spend: ${money(input.beforeCompletedSpend)}. This excludes failed Core because the old monolithic failure path did not retain provider usage.`,
    `- After completed-report spend: ${money(input.afterCompletedSpend)} for all six reports.`,
    `- Before wall time: ${seconds(input.beforeWallClockMs)} seconds, including the retained failed Core run.`,
    `- After wall time: ${seconds(input.afterWallClockMs)} seconds for six completed reports.`,
    "",
    "Raw prose remains in `before/reports.md` and `after/reports.md`."
  );
  return `${lines.join("\n")}\n`;
}

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writePrivate(path: string, content: string) {
  await writeFile(path, content, { mode: 0o600 });
  await chmod(path, 0o600);
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() || "" : "";
}

function sum(values: Array<number | undefined>) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function pair(before: number | undefined, after: number | undefined) {
  return `${display(before)} -> ${display(after)}`;
}

function moneyPair(before: number | undefined, after: number | undefined) {
  return `${before === undefined ? "unknown" : money(before)} -> ${after === undefined ? "unknown" : money(after)}`;
}

function money(value: number) {
  return `$${value.toFixed(4)}`;
}

function seconds(value: number | undefined) {
  return value === undefined ? undefined : Number((value / 1000).toFixed(1));
}

function display(value: number | undefined) {
  return value === undefined ? "unknown" : String(value);
}

function title(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
