import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import {
  ASTRA_OPENROUTER_APP_NAME,
  ASTRA_OPENROUTER_SITE_URL,
  OPENROUTER_DEFAULT_BASE_URL,
  reportModelProfileModels
} from "@astra/astrology";
import {
  astrologyReportRequestSchema,
  astrologyReportResultSchema,
  type AstrologyReportRequest,
  type AstrologyReportResult
} from "@astra/contracts";
import {
  astrologyReportRequests,
  astrologyReportResults,
  closeDatabaseConnection,
  db
} from "@astra/db";
import { inArray } from "drizzle-orm";

type SourceReport = {
  request: AstrologyReportRequest;
  result: AstrologyReportResult;
};

type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
};

const cheyenneReportId = "0e847db1-b09f-4e18-b16d-173b72ceabf1";
const tonyReportId = "v1-report:09b93dcb-938d-4cc2-8476-759343220be3";
const sourceIds = [cheyenneReportId, tonyReportId];
const model = reportModelProfileModels.production[0];
const reasoningEffort = "none";
const temperature = 0.3;
const maxOutputTokens = 16_000;
const generatedAt = new Date().toISOString();
const runStamp = generatedAt.replace(/[:.]/g, "-");
const privateExportRoot = resolve(".astra-exports");
const outputDir = resolve(
  option("--output") ||
    `.astra-exports/dual-perspective-synastry-bakeoff/${runStamp}`
);
const apiKey =
  clean(process.env.ASTRA_OPENROUTER_API_KEY) ||
  clean(process.env.OPENROUTER_API_KEY);

if (process.argv.includes("--help")) {
  console.log("Generate one private, non-persisted Dual-Perspective Synastry Portrait.");
  console.log("Generation: --generate [--output]. Validation only: --validate <portrait.md>.");
  process.exit(0);
}
const validationPath = option("--validate");
if (validationPath) {
  const portrait = await readFile(resolve(validationPath), "utf8");
  const validation = validatePortrait(portrait);
  console.log(JSON.stringify({ ok: validation.issues.length === 0, validation }, null, 2));
  process.exit(validation.issues.length ? 1 : 0);
}
if (!process.argv.includes("--generate")) {
  throw new Error("Use --generate to approve the single live Sonnet 5 model call.");
}
if (!apiKey) {
  throw new Error("ASTRA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is required.");
}
if (!outputDir.startsWith(`${privateExportRoot}${sep}`)) {
  throw new Error(`Private output must stay under ${privateExportRoot}.`);
}
if (model !== "anthropic/claude-sonnet-5") {
  throw new Error(
    `The current production writer is no longer Sonnet 5 (${model}). Review this experiment before running it.`
  );
}

await createPrivateDirectory(outputDir);

try {
  const reports = await loadSourceReports();
  const sourceMarkdown = renderSourceReports(reports);
  const prompt = buildPrompt(sourceMarkdown);
  const startedAt = Date.now();
  const generated = await generatePortrait(prompt);
  const latencyMs = Date.now() - startedAt;
  const portrait = normalizeMarkdown(generated.text);
  const validation = validatePortrait(portrait);

  await writePrivate(join(outputDir, "source-reports.md"), sourceMarkdown);
  await writePrivate(join(outputDir, "prompt.md"), `${prompt}\n`);
  await writePrivate(
    join(outputDir, "dual-perspective-synastry-portrait.md"),
    `${portrait}\n`
  );
  await writePrivate(
    join(outputDir, "manifest.json"),
    `${JSON.stringify(
      {
        experiment: "dual-perspective-synastry-shadow-generation-bakeoff",
        generatedAt,
        model,
        modelProfile: "production",
        provider: "openrouter",
        reasoningEffort,
        temperature,
        maxOutputTokens,
        productionWrite: false,
        databaseMode: "read-only",
        sourceReportIds: sourceIds,
        promptSha256: sha256(prompt),
        portraitSha256: sha256(portrait),
        latencyMs,
        finishReason: generated.finishReason,
        usage: generated.usage,
        validation
      },
      null,
      2
    )}\n`
  );

  console.log(
    JSON.stringify(
      {
        ok: validation.issues.length === 0,
        outputDir,
        model,
        latencyMs,
        usage: generated.usage,
        validation
      },
      null,
      2
    )
  );
  if (validation.issues.length) process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}

async function loadSourceReports() {
  const requestRows = await db
    .select()
    .from(astrologyReportRequests)
    .where(inArray(astrologyReportRequests.id, sourceIds));
  const resultRows = await db
    .select()
    .from(astrologyReportResults)
    .where(inArray(astrologyReportResults.requestId, sourceIds));

  const requests = new Map(
    requestRows.map((row) => [
      row.id,
      astrologyReportRequestSchema.parse({
        ...row,
        chartRequestId: row.chartRequestId ?? undefined,
        question: row.question ?? undefined,
        intent: row.intent ?? undefined,
        reportBasis: row.reportBasis ?? undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString()
      })
    ])
  );
  const results = new Map(
    resultRows.map((row) => [
      row.requestId,
      astrologyReportResultSchema.parse({
        ...row,
        summary: row.summary ?? undefined,
        publicSignal: row.publicSignal ?? undefined,
        reportBasis: row.reportBasis ?? undefined,
        generationMetadata: row.generationMetadata ?? undefined,
        error: row.error ?? undefined,
        createdAt: row.createdAt.toISOString()
      })
    ])
  );

  return sourceIds.map((id) => {
    const request = requests.get(id);
    const result = results.get(id);
    if (!request || !result) throw new Error(`Source report ${id} is missing.`);
    if (request.status !== "completed" || result.status !== "completed") {
      throw new Error(`Source report ${id} is not completed.`);
    }
    if (!result.sections.length) throw new Error(`Source report ${id} has no prose.`);
    return { request, result };
  });
}

function renderSourceReports(reports: SourceReport[]) {
  return reports
    .map(({ request, result }) => {
      const sections = result.sections
        .map((section) => `## ${section.title}\n\n${section.body}`)
        .join("\n\n");
      return [
        `# Source report: ${request.subjectName}`,
        "",
        `Source ID: \`${request.id}\``,
        `Provenance: ${result.provenance.map((item) => item.summary).join(" ")}`,
        "",
        result.summary ? `Summary: ${result.summary}\n` : "",
        sections
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

function buildPrompt(sourceMarkdown: string) {
  return `You are Astra's premium psychological-astrology portrait writer.

Write one experimental Dual-Perspective Synastry Portrait for Tony Cecala and Cheyenne Autumn. This is a private shadow-generation bakeoff, not a production report.

Purpose:
- Preserve the psychological density, specificity, restraint, and literary life of the stronger Cheyenne-facing source report.
- Make the asymmetry of lived experience central: show Tony's experience, Cheyenne's experience, and the relationship itself as three distinct protagonists.
- Create meaning, not a list of aspects. The astrology should operate as load-bearing evidence beneath the prose.
- Be emotionally candid and interesting. Do not sand down contradiction, desire, anger, projection, power, dependency, erotic charge, or unequal relational labor.

Required structure — use these exact H2 headings, in this order:
## 1. The Recognition
## 2. Cheyenne Inside Tony
## 3. Tony Inside Cheyenne
## 4. The Spell and the Projection
## 5. Desire, Anger, and Pursuit
## 6. The Love Language Under Pressure
## 7. The Shadow Bargain
## 8. The Relationship as a Third Being

Write an H1 title before Chapter 1 and a short italic deck that states the portrait's central thesis. Do not add any other H2 sections. Target 4,500-6,500 words total, with fully developed chapters rather than padded repetition.

Perspective discipline:
- When describing Tony's experience, explicitly say Tony and ground the claim in contacts to Tony's chart.
- When describing Cheyenne's experience, explicitly say Cheyenne and ground the claim in contacts to Cheyenne's chart.
- When describing the relationship as a third being, clearly label it as a synthesis of reciprocal interaspects. Do not invent a composite or Davison chart.
- Do not flatten reciprocal aspects into identical experiences. The same contact can land differently on the planet person and the point/planet receiving it.
- Treat interpretations as chart-grounded possibilities, not verified biography. Avoid generic advice, therapy language, safety disclaimers, and canned compatibility verdicts.

Evidence hierarchy:
1. The modern Cheyenne-facing report is the primary exact evidence source. Its timed tropical/whole-sign basis and named orbs may be used.
2. The imported Tony-facing report is a secondary literary and perspective source. Its named aspects may be used, but it lacks a modern immutable report-basis snapshot, so do not invent degrees or additional precision for its claims.
3. Do not introduce houses, angles, nodes, asteroids, midpoints, a composite chart, a Davison chart, or new aspects.
4. Do not claim a Yod. The available evidence does not establish a complete Yod configuration.

Exact modern evidence anchors:
- Cheyenne Sun sextile Tony Moon, orb 0.8 degrees.
- Cheyenne Moon trine Tony Pluto, orb 1.0 degree.
- Cheyenne Jupiter sextile Tony Moon, orb 1.0 degree.
- Cheyenne Sun conjunct Tony Neptune, orb 1.7 degrees.
- Cheyenne Mars square Tony Saturn, orb 0.2 degrees.
- Cheyenne Mercury square Tony Jupiter, orb 0.7 degrees.
- Cheyenne Sun square Tony Mars, orb 1.7 degrees.
- Cheyenne Mercury square Tony Mars, orb 2.8 degrees.
- Cheyenne Mercury trine Tony Chiron, orb 0.5 degrees.
- Cheyenne Mercury sextile Tony Pluto, orb 0.9 degrees.
- Cheyenne Mercury conjunct Tony Neptune, orb 2.9 degrees.
- Cheyenne Saturn trine Tony Moon, orb 2.3 degrees.
- Cheyenne Saturn sextile Tony Neptune, orb 0.2 degrees.
- Cheyenne Saturn sextile Tony Chiron, orb 2.5 degrees.
- Cheyenne Saturn trine Tony Pluto, orb 4.0 degrees.

Secondary imported-report claims, without degree precision unless the report itself supplies it:
- Tony Mercury trine Cheyenne Mars.
- Tony Mercury opposite Cheyenne Venus.
- Tony Sun quincunx Cheyenne Moon.
- Tony Moon sextile Cheyenne Mercury.
- Tony Moon trine Cheyenne Neptune.
- Tony Uranus trine Cheyenne Venus.
- Tony Saturn square Cheyenne Mercury.

Interpretive spine to develop rather than merely repeat:
- Tony may experience Cheyenne as emotionally legible, receiving, stabilizing, and enlarging because Tony's Moon is repeatedly contacted by Cheyenne's Sun, Jupiter, and Saturn.
- Cheyenne may experience Tony as psychologically penetrating or exposing because Cheyenne's Moon is held in Tony's Pluto field.
- Tony's feeling of safety may require effort from Cheyenne. Ask, in the prose rather than as a diagnostic verdict, whether what Tony experiences as reliability is partly what Cheyenne experiences as relational labor.
- Neptune makes recognition numinous but porous: Tony may idealize Cheyenne's identity; Cheyenne's Mercury may enter Tony's imaginative field and lose clean edges.
- Mars-Saturn and Sun/Mercury-Mars contacts make desire, momentum, correction, frustration, and timing inseparable.
- The relationship's central paradox is that one person may exhale at the same moment the other becomes more visible.

Source reports follow. Absorb them; do not quote or summarize them mechanically. Retain their best psychological discoveries while writing a genuinely new portrait.

<source_reports>
${sourceMarkdown}
</source_reports>

Return only the finished Markdown portrait.`;
}

async function generatePortrait(prompt: string) {
  const response = await fetch(`${OPENROUTER_DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "http-referer":
        clean(process.env.OPENROUTER_SITE_URL) || ASTRA_OPENROUTER_SITE_URL,
      "x-title":
        clean(process.env.OPENROUTER_APP_NAME) || ASTRA_OPENROUTER_APP_NAME
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      reasoning: { effort: reasoningEffort },
      temperature,
      max_tokens: maxOutputTokens
    })
  });
  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{
      finish_reason?: string;
      message?: { content?: unknown };
    }>;
    usage?: OpenRouterUsage;
  };
  if (!response.ok) {
    throw new Error(
      payload.error?.message || `OpenRouter failed with ${response.status}.`
    );
  }
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("OpenRouter returned no portrait.");
  }
  return {
    text,
    finishReason: payload.choices?.[0]?.finish_reason ?? null,
    usage: payload.usage ?? null
  };
}

function validatePortrait(markdown: string) {
  const expectedHeadings = [
    "1. The Recognition",
    "2. Cheyenne Inside Tony",
    "3. Tony Inside Cheyenne",
    "4. The Spell and the Projection",
    "5. Desire, Anger, and Pursuit",
    "6. The Love Language Under Pressure",
    "7. The Shadow Bargain",
    "8. The Relationship as a Third Being"
  ];
  const headings = [...markdown.matchAll(/^## (.+)$/gm)].map((match) =>
    match[1].trim()
  );
  const words = wordCount(markdown);
  const issues: string[] = [];
  if (!/^# [^#]/m.test(markdown)) issues.push("Missing H1 title.");
  if (JSON.stringify(headings) !== JSON.stringify(expectedHeadings)) {
    issues.push("The eight-chapter heading contract was not followed exactly.");
  }
  if (words < 4_000) issues.push(`Portrait is too short (${words} words).`);
  if (words > 7_000) issues.push(`Portrait is too long (${words} words).`);
  if ((markdown.match(/\bTony\b/g) ?? []).length < 20) {
    issues.push("Tony's perspective is not explicit enough.");
  }
  if ((markdown.match(/\bCheyenne\b/g) ?? []).length < 20) {
    issues.push("Cheyenne's perspective is not explicit enough.");
  }
  if ((markdown.match(/\brelationship\b/gi) ?? []).length < 12) {
    issues.push("The relationship-as-third-being perspective is underdeveloped.");
  }
  const inventedChartClaim = [
    ...markdown.matchAll(
      /\b(?:composite|Davison)\s+(?:Sun|Moon|Mercury|Venus|Mars|chart)\b/gi
    )
  ].some((match) => {
    const prefix = markdown.slice(Math.max(0, (match.index ?? 0) - 12), match.index);
    return !/\b(?:not a|no)\s*$/i.test(prefix);
  });
  if (inventedChartClaim) {
    issues.push("Portrait invents composite or Davison chart evidence.");
  }
  if (/\bYod\b/i.test(markdown)) {
    issues.push("Portrait discusses a Yod without a complete Yod configuration.");
  }
  return {
    issues,
    wordCount: words,
    chapterHeadings: headings,
    mentions: {
      Tony: (markdown.match(/\bTony\b/g) ?? []).length,
      Cheyenne: (markdown.match(/\bCheyenne\b/g) ?? []).length,
      relationship: (markdown.match(/\brelationship\b/gi) ?? []).length
    }
  };
}

function normalizeMarkdown(value: string) {
  return value
    .trim()
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function wordCount(value: string) {
  return value.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu)?.length ?? 0;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? clean(process.argv[index + 1]) : "";
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function createPrivateDirectory(path: string) {
  await mkdir(path, { recursive: true, mode: 0o700 });
  await chmod(path, 0o700);
}

async function writePrivate(path: string, content: string) {
  await createPrivateDirectory(dirname(path));
  await writeFile(path, content, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}
