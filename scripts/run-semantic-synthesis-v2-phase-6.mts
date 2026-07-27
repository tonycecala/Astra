import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildPhase6Variants,
  parseDeepMarkdown,
  renderPhase6Comparison,
  renderPhase6Preview,
  type Phase6Evidence
} from "./lib/semantic-synthesis-v2-phase-6";

const sourceRoot = resolve(
  option("--source") ??
  ".astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-cheyenne-claim-planned-bakeoff-v14"
);
const outputRoot = resolve(
  option("--output") ??
  ".astra-exports/semantic-synthesis-v2-phase-6/2026-07-27-cheyenne-presentation"
);
const reportPath = resolve(sourceRoot, "reports/cheyenne-autumn-deep-v2.md");
const evidencePath = resolve(sourceRoot, "evidence/cheyenne-autumn-deep.json");

const [markdown, evidenceText] = await Promise.all([
  readFile(reportPath, "utf8"),
  readFile(evidencePath, "utf8")
]);
const report = parseDeepMarkdown(markdown);
const evidence = JSON.parse(evidenceText) as Phase6Evidence;
const variants = buildPhase6Variants(report.sections, evidence);

await mkdir(outputRoot, { recursive: true, mode: 0o700 });
await Promise.all([
  writeFile(resolve(outputRoot, "comparison.json"), `${JSON.stringify({
    source: { reportPath, evidencePath },
    modelCalls: 0,
    reportGenerations: 0,
    variants
  }, null, 2)}\n`, { mode: 0o600 }),
  writeFile(resolve(outputRoot, "comparison.md"), renderPhase6Comparison(variants), { mode: 0o600 }),
  writeFile(resolve(outputRoot, "preview.html"), renderPhase6Preview(report.documentTitle, variants), { mode: 0o600 })
]);

console.log(`Phase 6 presentation packet written to ${outputRoot}`);

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
