import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { measureReportReadability } from "../packages/astrology/src/readability";
import { detectPortraitProseSignals, type PortraitProseSignal } from "../packages/astrology/src/report/portraitVoice";

export const PORTRAIT_PROSE_METRICS_SCHEMA = "astra.portrait-prose-metrics.v1";

type SignalWithLocation = PortraitProseSignal & {
  coordinateSpace: "body";
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
};

export type PortraitProseMetricsResult = {
  path: string;
  format?: "reading.md" | "result.json";
  metrics?: ReturnType<typeof measureReportReadability>;
  signalCounts?: Record<PortraitProseSignal["kind"], number>;
  signals?: SignalWithLocation[];
  error?: string;
};

export function proseBodyFromFile(filePath: string, raw: string): { format: "reading.md" | "result.json"; body: string } {
  if (filePath.endsWith(".reading.md")) {
    return { format: "reading.md", body: stripMarkdownHeadings(raw) };
  }
  if (filePath.endsWith(".result.json")) {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.sections)) {
      throw new Error("result JSON must contain a sections array");
    }
    const bodies = parsed.sections.map((section, index) => {
      if (!isRecord(section) || typeof section.body !== "string") {
        throw new Error(`result JSON section ${index + 1} must contain a body string`);
      }
      return section.body;
    });
    return { format: "result.json", body: bodies.join("\n\n") };
  }
  throw new Error("supported inputs are .reading.md and .result.json");
}

export function analyzePortraitProse(filePath: string): PortraitProseMetricsResult {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { format, body } = proseBodyFromFile(filePath, raw);
    if (!body.trim()) throw new Error("prose body is empty and cannot be scored");
    const signals = detectPortraitProseSignals(body).map((signal) => addLocation(body, signal));
    const signalCounts: Record<PortraitProseSignal["kind"], number> = {
      stock_phrase: 0,
      contrast_frame: 0,
      reassurance: 0
    };
    for (const signal of signals) signalCounts[signal.kind] += 1;
    return {
      path: filePath,
      format,
      metrics: measureReportReadability(body),
      signalCounts,
      signals
    };
  } catch (error) {
    return { path: filePath, error: error instanceof Error ? error.message : String(error) };
  }
}

export function analyzePortraitProseFiles(filePaths: string[]) {
  return {
    schema: PORTRAIT_PROSE_METRICS_SCHEMA,
    advisoryOnly: true,
    files: filePaths.map(analyzePortraitProse)
  };
}

function stripMarkdownHeadings(value: string) {
  return value.replace(/^\s{0,3}#{1,6}\s+.*(?:\r?\n|$)/gm, "");
}

function addLocation(body: string, signal: PortraitProseSignal): SignalWithLocation {
  const before = body.slice(0, signal.offset);
  const passageLines = signal.passage.split(/\r?\n/);
  const line = before.split(/\r?\n/).length;
  const column = signal.offset - (before.lastIndexOf("\n") + 1) + 1;
  return {
    ...signal,
    coordinateSpace: "body",
    line,
    column,
    endLine: line + passageLines.length - 1,
    endColumn: passageLines.length === 1 ? column + signal.passage.length - 1 : passageLines.at(-1)!.length
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseArgs(argv: string[]) {
  const files: string[] = [];
  let pretty = false;
  for (const arg of argv) {
    if (arg === "--pretty") pretty = true;
    else if (arg.startsWith("--")) throw new Error(`unknown option: ${arg}`);
    else files.push(path.resolve(arg));
  }
  if (!files.length) throw new Error("usage: portrait-prose-metrics [--pretty] <file.reading.md|file.result.json> [...]");
  return { files, pretty };
}

export function main(argv = process.argv.slice(2)) {
  try {
    const { files, pretty } = parseArgs(argv);
    const document = analyzePortraitProseFiles(files);
    process.stdout.write(JSON.stringify(document, null, pretty ? 2 : 0) + "\n");
    if (document.files.some((file) => file.error)) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
