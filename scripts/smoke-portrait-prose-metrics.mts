import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TRUEBYLINE_MODEL_CLICHE_SIGNALS } from "../packages/astrology/src/report/portraitVoice";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "astra-portrait-prose-"));
const cli = fileURLToPath(new URL("./portrait-prose-metrics.mts", import.meta.url));
const write = (name: string, content: string) => {
  const file = path.join(temp, name);
  fs.writeFileSync(file, content);
  return file;
};
const run = (...files: string[]) => {
  const result = spawnSync(process.execPath, ["--import", "tsx", cli, ...files], { encoding: "utf8" });
  assert.equal(result.error, undefined);
  return { status: result.status, document: JSON.parse(result.stdout) };
};

const baselineRun = run(write("baseline.reading.md", "# Heading\n\nA concrete observation stays useful. The reader can follow it."));
assert.equal(baselineRun.status, 0);
const baseline = baselineRun.document.files[0];
assert.equal(baseline.error, undefined);
assert.deepEqual(baseline.metrics && { wordCount: baseline.metrics.wordCount, sentenceCount: baseline.metrics.sentenceCount }, { wordCount: 10, sentenceCount: 2 });
assert.deepEqual(baseline.signalCounts, { stock_phrase: 0, contrast_frame: 0, reassurance: 0 });

const contrastBody = "This is not a flaw but a habit worth examining. This is not a flaw. It is a habit worth examining. The contrast is useful, but advisory.";
const contrastRun = run(write("contrast.reading.md", contrastBody));
assert.equal(contrastRun.status, 0);
const contrast = contrastRun.document.files[0];
const contrastSignals = contrast.signals as Array<{ kind: string; passage: string; offset: number; line: number; column: number; coordinateSpace: string; advisory: boolean }>;
assert.equal(contrastSignals.filter((signal) => signal.kind === "contrast_frame").length, 2);
assert.ok(contrastSignals.every((signal) => signal.advisory === true));
const sameSentence = contrastSignals.find((signal) => signal.passage.startsWith("not a flaw but a habit worth examining"));
assert.ok(sameSentence);
assert.equal(sameSentence.line, 1);
assert.equal(sameSentence.column, 9);
assert.equal(sameSentence.coordinateSpace, "body");
assert.equal(contrastBody.slice(sameSentence.offset, sameSentence.offset + sameSentence.passage.length), sameSentence.passage);

const stockText = TRUEBYLINE_MODEL_CLICHE_SIGNALS.join(" ");
const dash = run(write("dash.reading.md", "That is not modesty — it is how you are wired. You're not detached — you're translating.")).document.files[0];
assert.equal(dash.signalCounts?.contrast_frame, 2, "Counterdefinitions also use em dashes, not just literal but.");
const stockRun = run(write("stock.reading.md", stockText));
assert.equal(stockRun.status, 0);
const stock = stockRun.document.files[0];
assert.equal(stock.signalCounts?.stock_phrase, TRUEBYLINE_MODEL_CLICHE_SIGNALS.length);
const stockSignals = stock.signals as Array<{ passage: string; advisory: boolean }>;
assert.equal(stockSignals[0]?.passage, TRUEBYLINE_MODEL_CLICHE_SIGNALS[0]);
assert.ok(stockSignals.every((signal) => signal.advisory === true));

const emptyRun = run(write("empty.reading.md", "# Heading only\n"));
assert.equal(emptyRun.status, 1);
const empty = emptyRun.document.files[0];
assert.match(empty.error ?? "", /empty/);

const malformedRun = run(write("broken.result.json", "{ nope"));
assert.equal(malformedRun.status, 1);
const malformed = malformedRun.document.files[0];
assert.match(malformed.error ?? "", /JSON|Unexpected token/i);

const resultRun = run(write("sections.result.json", JSON.stringify({ sections: [{ title: "Excluded heading", body: "Body only." }] })));
assert.equal(resultRun.status, 0);
const result = resultRun.document.files[0];
assert.equal(result.metrics?.wordCount, 2);
assert.equal(result.metrics?.sentenceCount, 1);

const unsupportedRun = run(write("unsupported.txt", "Text"));
assert.equal(unsupportedRun.status, 1);
const unsupported = unsupportedRun.document.files[0];
assert.match(unsupported.error ?? "", /supported inputs/);

const aggregate = run(path.join(temp, "baseline.reading.md"), path.join(temp, "broken.result.json"));
assert.equal(aggregate.status, 1);
assert.equal(aggregate.document.advisoryOnly, true);
assert.equal(aggregate.document.files.length, 2);

const usage = spawnSync(process.execPath, ["--import", "tsx", cli], { encoding: "utf8" });
assert.equal(usage.status, 2);

console.log("Portrait prose metrics smoke checks passed: readability, headings, exact spans, six stock phrases, advisory signals, and safe errors.");
