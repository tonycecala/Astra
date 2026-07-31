import { createHash, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import {
  ASTRA_OPENROUTER_APP_NAME,
  ASTRA_OPENROUTER_SITE_URL,
  OPENROUTER_DEFAULT_BASE_URL,
  buildAstrologyChartSnapshot,
  buildAstrologyReportSectionEvidence,
  reportModelProfileModels
} from "@astra/astrology";
import {
  astrologyReportRequestSchema,
  chartMakerRequestSchema,
  type ChartMakerRequest
} from "@astra/contracts";
import {
  chartRequests,
  closeDatabaseConnection,
  db
} from "@astra/db";
import { inArray } from "drizzle-orm";

type SignalPacket = ReturnType<typeof buildAstrologyReportSectionEvidence>;
type SignalBullet = SignalPacket[number]["evidenceBullets"][number];
type ChartSnapshot = ReturnType<typeof buildAstrologyChartSnapshot>;

type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
};

type EvidenceEntry = {
  id: string;
  label: string;
  meaning: string;
  sections: string[];
};

type CleanProseTraceEntry = {
  chapter: string;
  evidenceIds: string[];
  supportedFeeling: string;
};

type CleanProseOutput = {
  portraitMarkdown: string;
  evidenceTrace: CleanProseTraceEntry[];
};

type SampleConfig = {
  key: string;
  primaryChartId: string;
  primaryName: string;
  partnerChartId: string;
  partnerName: string;
  storedAllyRelationship: string;
  experimentalAllyTag: "Child" | "Lover" | "Spouse";
  toneMode: "adult-romantic" | "family-caregiving-child" | "lover-romantic-sexual";
};

const sampleConfigs: Record<string, SampleConfig> = {
  "cheyenne-tony-lover": {
    key: "cheyenne-tony-lover",
    primaryChartId: "v1-chart:4f42aa82-c5fd-41d2-96b6-7f9143ace78c",
    primaryName: "Cheyenne Autumn",
    partnerChartId: "0fac9ad6-6ccd-4a30-ac0b-480892254f0f",
    partnerName: "Tony Cecala",
    storedAllyRelationship: "friend",
    experimentalAllyTag: "Lover",
    toneMode: "lover-romantic-sexual"
  },
  "felicia-tony-spouse": {
    key: "felicia-tony-spouse",
    primaryChartId: "v1-chart:d4eda33e-5cd8-4f24-b258-04a19887af72",
    primaryName: "Felicia Weiss",
    partnerChartId: "0fac9ad6-6ccd-4a30-ac0b-480892254f0f",
    partnerName: "Tony Cecala",
    storedAllyRelationship: "spouse",
    experimentalAllyTag: "Spouse",
    toneMode: "adult-romantic"
  },
  "marissa-tony-child": {
    key: "marissa-tony-child",
    primaryChartId: "v1-chart:2d2ac172-e68c-443e-8354-8d9432249905",
    primaryName: "Marissa Yahil",
    partnerChartId: "0fac9ad6-6ccd-4a30-ac0b-480892254f0f",
    partnerName: "Tony Cecala",
    storedAllyRelationship: "child",
    experimentalAllyTag: "Child",
    toneMode: "family-caregiving-child"
  }
};
const sampleKey = option("--sample") || "cheyenne-tony-lover";
const sample = sampleConfigs[sampleKey];
if (!sample) {
  throw new Error(`Unknown sample ${sampleKey}. Choose one of: ${Object.keys(sampleConfigs).join(", ")}.`);
}
const sourceChartIds = [sample.primaryChartId, sample.partnerChartId];
const evidenceHeadings = ["Attraction", "Friction", "Communication", "Stability"] as const;
const reportBodyIds = new Set([
  "sun", "moon", "mercury", "venus", "mars", "jupiter",
  "saturn", "uranus", "neptune", "pluto", "chiron"
]);
const majorAspectRules = [
  ["conjunction", 0, 8],
  ["sextile", 60, 5],
  ["square", 90, 7],
  ["trine", 120, 7],
  ["opposition", 180, 8]
] as const;
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
const completeInventory = process.argv.includes("--complete-inventory");
const cleanProseThriller = process.argv.includes("--clean-prose-thriller");
const blindBaselinePath = option("--blind-baseline");
const apiKey =
  clean(process.env.ASTRA_OPENROUTER_API_KEY) ||
  clean(process.env.OPENROUTER_API_KEY);

if (process.argv.includes("--help")) {
  console.log("Generate one private, direct-chart-signal Dual-Perspective Synastry Portrait.");
  console.log(`Samples: ${Object.keys(sampleConfigs).join(" | ")}.`);
  console.log("Generation: --generate [--sample <sample>] [--complete-inventory] [--output].");
  console.log("Clean prose: --generate --sample cheyenne-tony-lover --clean-prose-thriller --blind-baseline <portrait.md> [--output].");
  console.log("Signals only: --signals-only [--sample <sample>] [--complete-inventory] [--output].");
  console.log("Validation only: --validate <portrait.md> [--sample <sample>].");
  process.exit(0);
}

if (process.argv.includes("--self-test-clean-prose")) {
  const parsed = parseCleanProseOutput(`<portrait_markdown>\n# Test\n</portrait_markdown>\n<evidence_trace_json>\n[{"chapter":"1. The Recognition","evidenceIds":["S01"],"supportedFeeling":"A supported feeling long enough to validate."}]\n</evidence_trace_json>`);
  const blind = parseJsonObject(`{"reports":{"A":{"scores":{"emotionalSpecificity":8,"narrativeTension":8,"perspectiveBalance":8,"technicalCleanliness":8,"evidenceFidelity":8}},"B":{"scores":{"emotionalSpecificity":7,"narrativeTension":7,"perspectiveBalance":7,"technicalCleanliness":7,"evidenceFidelity":7}}},"preferred":"A","reason":"Report A is more specific while remaining grounded."}`);
  const issues = validateBlindEvaluation(blind);
  if (parsed.evidenceTrace[0]?.evidenceIds[0] !== "S01" || issues.length) {
    throw new Error(`Clean-prose self-test failed: ${issues.join("; ")}`);
  }
  console.log(JSON.stringify({ ok: true, parsedEvidenceId: "S01", blindEvaluationIssues: issues }, null, 2));
  process.exit(0);
}

const validationPath = option("--validate");
if (validationPath) {
  const portrait = await readFile(resolve(validationPath), "utf8");
  const validation = validatePortrait(portrait, undefined, completeInventory);
  console.log(JSON.stringify({ ok: validation.issues.length === 0, validation }, null, 2));
  process.exit(validation.issues.length ? 1 : 0);
}

const generationApproved = process.argv.includes("--generate");
const signalsOnly = process.argv.includes("--signals-only");
if (generationApproved === signalsOnly) {
  if (generationApproved) throw new Error("Choose either --generate or --signals-only, not both.");
  throw new Error("Use --generate or --signals-only.");
}
if (generationApproved && !apiKey) {
  throw new Error("ASTRA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is required.");
}
if (cleanProseThriller && (sample.key !== "cheyenne-tony-lover" || completeInventory)) {
  throw new Error("Clean-prose thriller mode requires --sample cheyenne-tony-lover and cannot use --complete-inventory.");
}
if (cleanProseThriller && generationApproved && !blindBaselinePath) {
  throw new Error("Clean-prose thriller mode requires --blind-baseline <portrait.md>.");
}
if (!outputDir.startsWith(`${privateExportRoot}${sep}`)) {
  throw new Error(`Private output must stay under ${privateExportRoot}.`);
}
if (generationApproved && model !== "anthropic/claude-sonnet-5") {
  throw new Error(
    `The current production writer is no longer Sonnet 5 (${model}). Review this experiment before running it.`
  );
}

await createPrivateDirectory(outputDir);

try {
  const charts = await loadSourceCharts();
  const request = buildDirectSignalRequest(charts);
  const inventory = completeInventory ? buildCompleteInteraspectInventory(request) : null;
  const signals = inventory?.signals ?? buildAstrologyReportSectionEvidence(request, evidenceHeadings);
  const signalValidation = validateSignalPacket(signals, inventory?.calculation);
  const evidenceEntries = buildEvidenceEntries(signals);
  const signalMarkdown = renderSignalPacket(
    signals,
    completeInventory,
    cleanProseThriller ? evidenceEntries : undefined
  );

  await writePrivate(join(outputDir, "chart-signals.md"), `${signalMarkdown}\n`);

  if (signalsOnly) {
    await writePrivate(
      join(outputDir, "signal-manifest.json"),
      `${JSON.stringify(signalManifest(signalMarkdown, signalValidation, inventory?.calculation), null, 2)}\n`
    );
    console.log(JSON.stringify({
      ok: signalValidation.issues.length === 0,
      outputDir,
      signalValidation
    }, null, 2));
    if (signalValidation.issues.length) process.exitCode = 1;
  } else if (cleanProseThriller) {
    await runCleanProseExperiment({ signals, evidenceEntries, signalMarkdown, signalValidation });
  } else {
    const prompt = buildPrompt(signalMarkdown, completeInventory);
    const startedAt = Date.now();
    const generated = await generatePortrait(prompt);
    const latencyMs = Date.now() - startedAt;
    const portrait = normalizeMarkdown(generated.text);
    const validation = validatePortrait(portrait, signals, completeInventory);

    await writePrivate(join(outputDir, "prompt.md"), `${prompt}\n`);
    await writePrivate(
      join(outputDir, "dual-perspective-synastry-portrait.md"),
      `${portrait}\n`
    );
    await writePrivate(
      join(outputDir, "manifest.json"),
      `${JSON.stringify(
        {
          ...signalManifest(signalMarkdown, signalValidation, inventory?.calculation),
          model,
          modelProfile: "production",
          provider: "openrouter",
          reasoningEffort,
          temperature,
          maxOutputTokens,
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

    console.log(JSON.stringify({
      ok: signalValidation.issues.length === 0 && validation.issues.length === 0,
      outputDir,
      model,
      latencyMs,
      usage: generated.usage,
      signalValidation,
      validation
    }, null, 2));
    if (signalValidation.issues.length || validation.issues.length) process.exitCode = 1;
  }
} finally {
  await closeDatabaseConnection();
}

async function loadSourceCharts() {
  const rows = await db
    .select()
    .from(chartRequests)
    .where(inArray(chartRequests.id, sourceChartIds));
  const charts = new Map(
    rows.map((row) => [
      row.id,
      chartMakerRequestSchema.parse({
        ...row,
        question: row.question ?? undefined,
        intent: row.intent ?? undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString()
      })
    ])
  );
  return sourceChartIds.map((id) => {
    const chart = charts.get(id);
    if (!chart) throw new Error(`Source chart ${id} is missing.`);
    if (chart.status !== "completed") throw new Error(`Source chart ${id} is not completed.`);
    return chart;
  });
}

function buildDirectSignalRequest(charts: ChartMakerRequest[]) {
  const primary = charts.find((chart) => chart.id === sample.primaryChartId);
  const partner = charts.find((chart) => chart.id === sample.partnerChartId);
  if (!primary || !partner) throw new Error(`${sample.primaryName} and ${sample.partnerName} source charts are required.`);
  if (primary.userId !== partner.userId) throw new Error("Source charts must share an owner.");
  if (
    firstName(primary.subjectName) !== firstName(sample.primaryName) ||
    firstName(partner.subjectName) !== firstName(sample.partnerName)
  ) {
    throw new Error("Source chart names no longer match the selected sample.");
  }
  const storedRelationship = chartRelationship(primary);
  if (storedRelationship.toLowerCase() !== sample.storedAllyRelationship.toLowerCase()) {
    throw new Error(
      `Selected sample expects stored Ally relationship ${sample.storedAllyRelationship}, found ${storedRelationship || "none"}.`
    );
  }
  return astrologyReportRequestSchema.parse({
    id: randomUUID(),
    userId: primary.userId,
    chartRequestId: primary.id,
    reportType: "synastry",
    subjectName: `${sample.primaryName} + ${sample.partnerName}`,
    birthData: primary.birthData,
    question: "What is the distinct psychological experience of each person and of this relationship?",
    intent: "experimental-direct-chart-signal-dual-perspective-synastry-v3",
    context: {},
    source: "ally",
    boundary: "private",
    status: "queued",
    costCredits: 0,
    reportBasis: {
      schemaVersion: 2,
      type: "synastry",
      chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
      primary: {
        chartRequestId: primary.id,
        subjectType: "ally",
        subjectId: primary.id,
        subjectName: sample.primaryName,
        birthData: primary.birthData,
        calculationMode: "full"
      },
      partner: {
        chartRequestId: partner.id,
        subjectType: "self",
        subjectId: partner.userId,
        subjectName: sample.partnerName,
        birthData: partner.birthData,
        calculationMode: "full"
      }
    },
    createdAt: generatedAt,
    updatedAt: generatedAt
  });
}

function buildEvidenceEntries(signals: SignalPacket): EvidenceEntry[] {
  const entries: EvidenceEntry[] = [];
  const byLabel = new Map<string, EvidenceEntry>();
  for (const section of signals) {
    for (const bullet of section.evidenceBullets) {
      const existing = byLabel.get(bullet.label);
      if (existing) {
        if (!existing.sections.includes(section.title)) existing.sections.push(section.title);
        continue;
      }
      const entry: EvidenceEntry = {
        id: `S${String(entries.length + 1).padStart(2, "0")}`,
        label: bullet.label,
        meaning: bullet.meaning,
        sections: [section.title]
      };
      entries.push(entry);
      byLabel.set(bullet.label, entry);
    }
  }
  return entries;
}

function renderSignalPacket(
  signals: SignalPacket,
  completeInventory: boolean,
  evidenceEntries?: EvidenceEntry[]
) {
  const evidenceIdByLabel = new Map(
    (evidenceEntries ?? []).map((entry) => [entry.label, entry.id])
  );
  return [
    completeInventory
      ? "# Complete Direct Synastry Interaspect Inventory"
      : "# Direct Synastry Chart Signals",
    "",
    completeInventory
      ? "Source: Astra canonical two-chart calculation before strongest-contact ranking."
      : "Source: Astra canonical two-chart calculation and section-evidence selection.",
    "Report prose supplied to writer: none.",
    "",
    ...signals.flatMap((section) => [
      `## ${section.title}`,
      "",
      ...section.evidenceBullets.map((bullet) => {
        const id = evidenceIdByLabel.get(bullet.label);
        return `- ${id ? `[${id}] ` : ""}${bullet.label}: ${bullet.meaning}`;
      }),
      ""
    ])
  ].join("\n").trim();
}

function buildPrompt(signalMarkdown: string, completeInventory: boolean) {
  const primaryFirstName = firstName(sample.primaryName);
  const partnerFirstName = firstName(sample.partnerName);
  const headings = expectedPortraitHeadings().map((heading) => `## ${heading}`).join("\n");
  const packetContract = completeInventory
    ? `The packet is the complete calculated inventory of supported major interaspects between Astra's standard report bodies. Do not treat contact count as a vote, give wide-orb or outer-planet contacts equal weight by default, or force every contact into the portrait. Select load-bearing evidence by exactness, personal-planet relevance, recurrence, and explanatory value. The inventory excludes house overlays, angles, nodes, asteroids, midpoints, Yods, composite charts, and Davison charts; do not infer anything about those excluded systems.`
    : `The packet is a curated selection of the strongest contacts, not an exhaustive list. Never infer that an unlisted reciprocal contact does not exist, and never rank which person contributes more by treating omitted signals as negative evidence.`;
  return `You are Astra's premium psychological-astrology portrait writer.

Write one experimental Dual-Perspective Synastry Portrait for ${sample.partnerName} and ${sample.primaryName}. This is a private shadow-generation bakeoff, not a production report.

Relationship context:
- ${sample.primaryName} is stored as ${sample.partnerName}'s Ally with saved relationship "${sample.storedAllyRelationship}."
- For this private test only, route the portrait through requested Ally tag "${sample.experimentalAllyTag}." Do not write this experimental tag back to the app or database.
- ${toneInstruction()}
- The Ally relationship label is routing context, not evidence of relationship history. Do not claim how they met, what happened at a first look or first conversation, fell in love, built a life, divided relational labor, or what their current relationship is like. Interaspects cannot establish those biographical facts. Never frame attraction as bypassing, preceding, or overriding consent.

Purpose:
- Produce psychologically dense, specific, restrained, literary writing without relying on any prior report prose.
- Make the asymmetry of lived experience central: show ${partnerFirstName}'s experience, ${primaryFirstName}'s experience, and the relationship itself as three distinct protagonists.
- Create meaning, not a list of aspects. The astrology should operate as load-bearing evidence beneath the prose.
- ${candorInstruction()}

Required structure — use these exact H2 headings, in this order:
${headings}

Write an H1 title before Chapter 1 and a short italic deck that states the portrait's central thesis. Do not add any other H2 sections. Target 4,200-5,800 words total, with fully developed chapters rather than padded repetition.

Perspective discipline:
- When describing ${partnerFirstName}'s experience, explicitly say ${partnerFirstName} and ground the claim in contacts to ${partnerFirstName}'s chart.
- When describing ${primaryFirstName}'s experience, explicitly say ${primaryFirstName} and ground the claim in contacts to ${primaryFirstName}'s chart.
- When describing the relationship as a third being, clearly label it as a synthesis of reciprocal interaspects. Do not invent a composite or Davison chart.
- Do not flatten reciprocal aspects into identical experiences. The same contact can land differently on the planet person and the planet receiving it.
- Treat interpretations as chart-grounded possibilities, not verified biography. Avoid generic advice, therapy language, safety disclaimers, and canned compatibility verdicts.

Evidence contract:
- The chart-signal packet below is the only astrological evidence supplied. Use no aspect, placement, house, angle, node, asteroid, midpoint, Yod, composite chart, or Davison claim that is absent from it.
- Degree, orb, closeness, and exactness language is calculation trace only. Do not mention degrees, orbs, exactness, near-exactness, tightness, or how close a contact is anywhere in the portrait, even without a number, and never convert decimal degrees into degree-minute notation.
- Do not import a conclusion from an earlier report; none is provided.
- ${packetContract}
- An interaspect is reciprocal even when its two people experience the contacted planets differently. Do not describe the aspect itself as energy flowing only one way.
- The four packet headings are evidence-selection jobs, not the required output structure. Recompose their signals across the eight chapters.
- Build Chapters 2 and 3 from how the same interaspects land differently for each named person.
- ${chapterEvidenceInstructions()}
- Chapter 8 must be a fully developed synthesis of at least 400 words. Do not satisfy the third-being perspective by merely repeating the phrase "the relationship."
- Never describe either person as the load-bearing partner, say one gives more than they receive, claim one provides the floor or architecture, or assign unequal relational labor from aspect direction or contact volume.
- If a desired theme is not supported by a supplied signal, omit that theme rather than filling the gap.

<chart_signals>
${signalMarkdown}
</chart_signals>

Return only the finished Markdown portrait.`;
}

async function runCleanProseExperiment(input: {
  signals: SignalPacket;
  evidenceEntries: EvidenceEntry[];
  signalMarkdown: string;
  signalValidation: ReturnType<typeof validateSignalPacket>;
}) {
  const prompt = buildCleanProsePrompt(input.signalMarkdown, input.evidenceEntries);
  const startedAt = Date.now();
  const generated = await generatePortrait(prompt);
  const latencyMs = Date.now() - startedAt;
  const parsed = parseCleanProseOutput(generated.text);
  const portrait = normalizeMarkdown(parsed.portraitMarkdown);
  const validation = validateCleanProsePortrait(portrait, parsed.evidenceTrace, input.evidenceEntries);

  await writePrivate(join(outputDir, "prompt.md"), `${prompt}\n`);
  await writePrivate(join(outputDir, "writer-response.txt"), `${generated.text.trim()}\n`);
  await writePrivate(join(outputDir, "clean-prose-portrait.md"), `${portrait}\n`);
  await writePrivate(
    join(outputDir, "evidence-index.json"),
    `${JSON.stringify(input.evidenceEntries, null, 2)}\n`
  );
  await writePrivate(
    join(outputDir, "evidence-trace.json"),
    `${JSON.stringify(parsed.evidenceTrace, null, 2)}\n`
  );

  const baselinePath = resolve(blindBaselinePath);
  if (!baselinePath.startsWith(`${privateExportRoot}${sep}`)) {
    throw new Error("Blind baseline must stay under the private export root.");
  }
  const baselinePortrait = await readFile(baselinePath, "utf8");
  const baselineManifestPath = join(dirname(baselinePath), "manifest.json");
  const baselineManifest = JSON.parse(await readFile(baselineManifestPath, "utf8")) as {
    signalValidation?: { labelsBySection?: unknown };
    validation?: { groundedSignalCount?: number };
  };
  const baselineSignalPacketMatch = JSON.stringify(baselineManifest.signalValidation?.labelsBySection) ===
    JSON.stringify(input.signalValidation.labelsBySection);
  if (!baselineSignalPacketMatch) {
    throw new Error("Blind baseline does not use the exact same strongest-15 signal packet.");
  }

  const cleanIsA = Number.parseInt(sha256(`${portrait}\n${baselinePortrait}`).slice(0, 2), 16) % 2 === 0;
  const reportA = cleanIsA ? portrait : baselinePortrait;
  const reportB = cleanIsA ? baselinePortrait : portrait;
  const comparisonPrompt = buildBlindComparisonPrompt(input.signalMarkdown, reportA, reportB);
  const comparisonStartedAt = Date.now();
  const comparisonGenerated = await generatePortrait(comparisonPrompt);
  const comparisonLatencyMs = Date.now() - comparisonStartedAt;
  const blindEvaluation = parseJsonObject(comparisonGenerated.text);
  const blindEvaluationIssues = validateBlindEvaluation(blindEvaluation);
  const objectiveMetrics = {
    A: proseMetrics(reportA),
    B: proseMetrics(reportB),
    cleanProse: {
      ...proseMetrics(portrait),
      tracedEvidenceCount: new Set(parsed.evidenceTrace.flatMap((entry) => entry.evidenceIds)).size
    },
    currentV3: {
      ...proseMetrics(baselinePortrait),
      visiblyGroundedSignalCount: baselineManifest.validation?.groundedSignalCount ?? null
    }
  };
  const mapping = {
    A: cleanIsA ? "clean-prose-thriller" : "current-v3",
    B: cleanIsA ? "current-v3" : "clean-prose-thriller"
  } as const;

  await writePrivate(join(outputDir, "blind-comparison-prompt.md"), `${comparisonPrompt}\n`);
  await writePrivate(join(outputDir, "blind-evaluation-raw.txt"), `${comparisonGenerated.text.trim()}\n`);
  await writePrivate(join(outputDir, "blind-mapping.json"), `${JSON.stringify(mapping, null, 2)}\n`);
  await writePrivate(
    join(outputDir, "blind-comparison.md"),
    `${renderBlindComparison(blindEvaluation, blindEvaluationIssues, mapping, objectiveMetrics)}\n`
  );

  const manifest = {
    ...signalManifest(input.signalMarkdown, input.signalValidation),
    experiment: "dual-perspective-synastry-v3-clean-prose-psychological-thriller",
    cleanProseThriller: true,
    model,
    modelProfile: "production",
    provider: "openrouter",
    reasoningEffort,
    temperature,
    maxOutputTokens,
    writerInput: {
      directChartSignalsOnly: true,
      sourceReportIds: [],
      baselineReportProseIncluded: false
    },
    evidenceTrace: {
      stableEvidenceIds: input.evidenceEntries.map((entry) => entry.id),
      uniqueEvidenceCount: input.evidenceEntries.length,
      tracedEvidenceCount: objectiveMetrics.cleanProse.tracedEvidenceCount,
      traceSha256: sha256(JSON.stringify(parsed.evidenceTrace))
    },
    promptSha256: sha256(prompt),
    portraitSha256: sha256(portrait),
    latencyMs,
    finishReason: generated.finishReason,
    usage: generated.usage,
    validation,
    blindComparison: {
      baselinePortraitSha256: sha256(baselinePortrait),
      baselineSignalPacketMatch,
      mapping,
      evaluatorModel: model,
      evaluatorInputPurpose: "blind-editorial-comparison-only",
      comparisonPromptSha256: sha256(comparisonPrompt),
      comparisonLatencyMs,
      finishReason: comparisonGenerated.finishReason,
      usage: comparisonGenerated.usage,
      issues: blindEvaluationIssues,
      result: blindEvaluation,
      objectiveMetrics
    }
  };
  await writePrivate(join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const ok = input.signalValidation.issues.length === 0 &&
    validation.issues.length === 0 &&
    blindEvaluationIssues.length === 0;
  console.log(JSON.stringify({
    ok,
    outputDir,
    model,
    latencyMs,
    usage: generated.usage,
    signalValidation: input.signalValidation,
    validation,
    blindComparison: {
      mapping,
      usage: comparisonGenerated.usage,
      issues: blindEvaluationIssues,
      result: blindEvaluation,
      objectiveMetrics
    }
  }, null, 2));
  if (!ok) process.exitCode = 1;
}

function cleanProseHeadings() {
  return [
    "1. The Recognition",
    "2. What Cheyenne Awakens in You",
    "3. What You Awaken in Cheyenne",
    "4. The Room Where Desire Turns",
    "5. The Hidden Bargain",
    "6. The Third Presence"
  ];
}

function buildCleanProsePrompt(signalMarkdown: string, evidenceEntries: EvidenceEntry[]) {
  const headings = cleanProseHeadings().map((heading) => `## ${heading}`).join("\n");
  return `You are Astra's premium psychological portrait writer. Write one private experimental Tony Cecala + Cheyenne Autumn Lover portrait in a clean-prose psychological-thriller register.

This is still direct-chart-signal generation. The packet below is the only astrological evidence. No saved report prose is supplied. Stable S-number IDs exist only so your hidden evidence trace can prove grounding without forcing astrology into the finished portrait.

Rendered-prose contract:
- Address Tony as "you" and "your," not as Tony. Refer to Cheyenne naturally by name and as she/her.
- Preserve three protagonists: your felt experience, Cheyenne's distinct felt experience, and the relationship as a presence with its own pressure and momentum.
- Lead every paragraph with a specific feeling, impulse, bodily response, fear, misreading, temptation, reversal, or hidden relational consequence. Let the evidence stay beneath the sentence.
- Write with psychological-thriller propulsion: recognition that feels dangerous, warmth with a hidden cost, desire that changes shape under pressure, and intimacy that can become exposure. Do not invent crimes, literal danger, secrets, pathology, or melodramatic biography.
- The opening must make the connection explicitly romantic and sexual, while treating consent, actual behavior, exclusivity, commitment, permanence, and history as unknown.
- Do not claim a first look, first conversation, how they met, actual sexual contact, falling in love, shared routines, relationship duration, or current relationship state.
- Do not turn the felt charge into fate or history. Avoid inevitability, destiny, meant-to-be language, ancient or old contracts, timeless recognition, old bones, or claims that the relationship began before the people did.
- Do not assign one person more relational labor, stability, architecture, responsibility, giving, or cost than the other.
- Do not give advice, action steps, compatibility verdicts, therapy language, or a stay/leave conclusion.
- Use no technical astrology language anywhere in portraitMarkdown: no planet, sign, aspect, chart, synastry, placement, degree, orb, house, angle, node, or astrological-system terminology. Do not include evidence IDs in portraitMarkdown.
- Target 2,000-2,600 words.

Use these exact H2 headings in order:
${headings}

Place one H1 title and a short italic deck before Chapter 1. Make Chapter 6 a developed synthesis of at least 300 words.

Hidden-trace contract:
- After the portrait, return exactly one evidence-trace entry for each H2 chapter.
- Each entry must use the exact chapter heading without the leading "## ", cite 1-5 valid evidence IDs, and state the chapter's supported feeling in one concise sentence.
- Across the trace, use at least 10 unique IDs. Do not force an ID into prose or claim more than its source supports.

Return exactly this two-block format and nothing else:
<portrait_markdown>
# Title
...
</portrait_markdown>
<evidence_trace_json>
[
  {"chapter":"1. The Recognition","evidenceIds":["S01","S02"],"supportedFeeling":"..."}
]
</evidence_trace_json>

The valid IDs are: ${evidenceEntries.map((entry) => entry.id).join(", ")}.

<chart_signals>
${signalMarkdown}
</chart_signals>`;
}

function parseCleanProseOutput(value: string): CleanProseOutput {
  const portrait = value.match(/<portrait_markdown>\s*([\s\S]*?)\s*<\/portrait_markdown>/i)?.[1];
  const traceText = value.match(/<evidence_trace_json>\s*([\s\S]*?)\s*<\/evidence_trace_json>/i)?.[1];
  if (!portrait || !traceText) throw new Error("Clean-prose writer did not return both required blocks.");
  const trace = JSON.parse(traceText) as unknown;
  if (!Array.isArray(trace)) throw new Error("Clean-prose evidence trace is not an array.");
  return {
    portraitMarkdown: portrait,
    evidenceTrace: trace.map((entry) => {
      const record = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return {
        chapter: clean(record.chapter),
        evidenceIds: Array.isArray(record.evidenceIds) ? record.evidenceIds.map(clean).filter(Boolean) : [],
        supportedFeeling: clean(record.supportedFeeling)
      };
    })
  };
}

function validateCleanProsePortrait(
  markdown: string,
  trace: CleanProseTraceEntry[],
  evidenceEntries: EvidenceEntry[]
) {
  const issues: string[] = [];
  const words = wordCount(markdown);
  const headings = [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
  const expectedHeadings = cleanProseHeadings();
  const technicalClaims = [...markdown.matchAll(cleanProseTechnicalPattern())].map((match) => match[0]);
  const evidenceIdClaims = [...markdown.matchAll(/\bS\d{2}\b/g)].map((match) => match[0]);
  const fateClaims = [...markdown.matchAll(/\b(?:inevitab\w*|destin(?:y|ed)|fated|meant to be|ancient contract|old contract|old bones|timeless recognition|began (?:somewhere )?before (?:either|they|you))\b/gi)].map((match) => match[0]);
  const contributionLedgerClaims = [...markdown.matchAll(/\b(?:load-bearing|unequal bargain|provid(?:e|es|ing) the floor|gives? more.{0,80}receives?|more architecture.{0,80}receives?|costs? (?:him|her|them) ongoing effort|over-function(?:s|ing)?|she tempers.{0,80}you (?:widen|contain)|you (?:widen|contain).{0,80}she tempers)\b/gi)].map((match) => match[0]);
  const biographyClaims = [...markdown.matchAll(/\b(?:first (?:look|glance|conversation|contact)|how (?:you|they) met|when (?:you|they) met|fell in love|shared (?:meal|home|routine)|years together)\b/gi)].map((match) => match[0]);
  const validIds = new Set(evidenceEntries.map((entry) => entry.id));
  const traceIds = trace.flatMap((entry) => entry.evidenceIds);
  const invalidTraceIds = traceIds.filter((id) => !validIds.has(id));
  const uniqueTraceIds = new Set(traceIds);
  const opening = markdown.slice(0, 1_500);
  const chapterSix = markdown.split(/^## 6\.[^\n]*$/m)[1] ?? "";

  if (!/^# [^#]/m.test(markdown)) issues.push("Clean prose is missing an H1 title.");
  if (!/^\*[^*]+\*$/m.test(markdown)) issues.push("Clean prose is missing its italic deck.");
  if (JSON.stringify(headings) !== JSON.stringify(expectedHeadings)) issues.push("Clean prose did not follow the six-chapter heading contract.");
  if (words < 2_000 || words > 2_600) issues.push(`Clean prose misses the 2,000-2,600 word target (${words}).`);
  if (wordCount(chapterSix) < 300) issues.push(`The third-presence chapter is underdeveloped (${wordCount(chapterSix)} words).`);
  if ((markdown.match(/\byou\b|\byour\b/gi) ?? []).length < 45) issues.push("Tony is not addressed directly enough as you.");
  if (nameMentions(markdown, "Tony") > 3) issues.push("Clean prose names Tony instead of addressing him as you.");
  if (nameMentions(markdown, "Cheyenne") < 12) issues.push("Cheyenne's distinct perspective is undernamed.");
  if (!/\bromantic\b/i.test(opening) || !/\bsexual\b/i.test(opening)) issues.push("Lover opening does not explicitly establish romantic and sexual overtones.");
  if (technicalClaims.length) issues.push("Rendered portrait leaks technical astrology language.");
  if (evidenceIdClaims.length) issues.push("Rendered portrait leaks hidden evidence IDs.");
  if (fateClaims.length) issues.push("Rendered portrait turns felt charge into unsupported fate or history.");
  if (contributionLedgerClaims.length) issues.push("Rendered portrait assigns comparative relational labor.");
  if (biographyClaims.length) issues.push("Rendered portrait invents relationship biography.");
  if (trace.length !== expectedHeadings.length || trace.some((entry, index) => entry.chapter !== expectedHeadings[index])) {
    issues.push("Evidence trace does not map one ordered entry to each chapter.");
  }
  if (trace.some((entry) => entry.evidenceIds.length < 1 || entry.evidenceIds.length > 5 || entry.supportedFeeling.length < 20)) {
    issues.push("Evidence trace entries are incomplete or overstuffed.");
  }
  if (invalidTraceIds.length) issues.push(`Evidence trace contains invalid IDs: ${[...new Set(invalidTraceIds)].join(", ")}.`);
  if (uniqueTraceIds.size < 10) issues.push(`Evidence trace uses too few unique signals (${uniqueTraceIds.size}).`);

  return {
    issues,
    wordCount: words,
    chapterHeadings: headings,
    chapterSixWordCount: wordCount(chapterSix),
    technicalClaims,
    evidenceIdClaims,
    fateClaims,
    contributionLedgerClaims,
    biographyClaims,
    traceEntryCount: trace.length,
    tracedEvidenceCount: uniqueTraceIds.size,
    invalidTraceIds,
    mentions: {
      you: (markdown.match(/\byou\b|\byour\b/gi) ?? []).length,
      Tony: nameMentions(markdown, "Tony"),
      Cheyenne: nameMentions(markdown, "Cheyenne")
    }
  };
}

function cleanProseTechnicalPattern() {
  return /[°º]|\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|conjunction|conjunct|sextile|square|trine|opposition|opposite|aspect|synastry|astrology|astrological|chart|planet|placement|orb|degrees?|houses?|angles?|nodes?|luminary|Neptunian|Plutonian|Saturnian|Venusian|Martian)\b/gi;
}

function buildBlindComparisonPrompt(signalMarkdown: string, reportA: string, reportB: string) {
  return `You are a blind senior editorial evaluator for a private Astra Synastry V3 experiment. You do not know which report is the control or the experimental variant. Do not infer or discuss their implementation.

Both reports were intended to interpret the exact same strongest-15 direct chart-signal packet below for Tony Cecala and Cheyenne Autumn under a Lover lens. Evaluate the rendered prose, not whether it visibly names astrology. A report may remain evidence-faithful through psychologically precise paraphrase. Penalize unsupported biography, deterministic claims, unequal-labor verdicts, or themes that cannot be traced to the packet.

Score each report from 1-10 on:
- emotionalSpecificity: concrete, differentiated feelings rather than generic intensity;
- narrativeTension: psychological-thriller propulsion, reversals, hidden costs, and forward movement without melodrama;
- perspectiveBalance: Tony's felt experience, Cheyenne's distinct felt experience, and the relationship as a third protagonist;
- technicalCleanliness: 10 means the portrait reads cleanly with no distracting astrology exposition;
- evidenceFidelity: psychological claims remain supportable by the supplied packet even when evidence is not named.

Then choose A, B, or Tie. Return JSON only in this exact shape:
{"reports":{"A":{"scores":{"emotionalSpecificity":1,"narrativeTension":1,"perspectiveBalance":1,"technicalCleanliness":1,"evidenceFidelity":1},"strengths":["..."],"risks":["..."]},"B":{"scores":{"emotionalSpecificity":1,"narrativeTension":1,"perspectiveBalance":1,"technicalCleanliness":1,"evidenceFidelity":1},"strengths":["..."],"risks":["..."]}},"preferred":"A","reason":"..."}

<evidence_packet>
${signalMarkdown}
</evidence_packet>

<report_A>
${reportA}
</report_A>

<report_B>
${reportB}
</report_B>`;
}

function parseJsonObject(value: string): Record<string, unknown> {
  const normalized = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(normalized) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Blind evaluator did not return a JSON object.");
  return parsed as Record<string, unknown>;
}

function validateBlindEvaluation(value: Record<string, unknown>) {
  const issues: string[] = [];
  const reports = value.reports && typeof value.reports === "object" ? value.reports as Record<string, unknown> : {};
  for (const label of ["A", "B"]) {
    const report = reports[label] && typeof reports[label] === "object" ? reports[label] as Record<string, unknown> : {};
    const scores = report.scores && typeof report.scores === "object" ? report.scores as Record<string, unknown> : {};
    for (const criterion of ["emotionalSpecificity", "narrativeTension", "perspectiveBalance", "technicalCleanliness", "evidenceFidelity"]) {
      const score = scores[criterion];
      if (typeof score !== "number" || score < 1 || score > 10) issues.push(`${label}.${criterion} is not a 1-10 score.`);
    }
  }
  if (!["A", "B", "Tie"].includes(clean(value.preferred))) issues.push("Blind evaluator preference is invalid.");
  if (clean(value.reason).length < 20) issues.push("Blind evaluator reason is too short.");
  return issues;
}

function proseMetrics(markdown: string) {
  const technicalTerms = [...markdown.matchAll(cleanProseTechnicalPattern())].map((match) => match[0]);
  const feelingTerms = markdown.match(/\b(?:feel|feels|felt|want|wants|wanting|desire|fear|afraid|ache|longing|tender|tension|pull|charge|trust|hurt|anger|friction|risk|recognition|intimacy|attraction|erotic|sexual|romantic|exposed|vulnerable|safety|safe|pressure|relief)\w*\b/gi) ?? [];
  const words = wordCount(markdown);
  return {
    wordCount: words,
    chapterCount: [...markdown.matchAll(/^## /gm)].length,
    technicalTermCount: technicalTerms.length,
    technicalTermsPerThousandWords: Number(((technicalTerms.length / Math.max(words, 1)) * 1_000).toFixed(1)),
    feelingTermCount: feelingTerms.length,
    feelingTermsPerThousandWords: Number(((feelingTerms.length / Math.max(words, 1)) * 1_000).toFixed(1)),
    TonyMentions: nameMentions(markdown, "Tony"),
    CheyenneMentions: nameMentions(markdown, "Cheyenne"),
    secondPersonMentions: (markdown.match(/\byou\b|\byour\b/gi) ?? []).length
  };
}

function renderBlindComparison(
  blindEvaluation: Record<string, unknown>,
  issues: string[],
  mapping: { A: string; B: string },
  objectiveMetrics: Record<string, unknown>
) {
  return [
    "# Blind Clean-Prose Comparison",
    "",
    "The evaluator received the same strongest-15 chart packet and two portraits labeled only A and B. Mapping was revealed after scoring.",
    "",
    "## Blind result",
    "",
    "```json",
    JSON.stringify(blindEvaluation, null, 2),
    "```",
    "",
    `Evaluator validation: ${issues.length ? `FAIL — ${issues.join("; ")}` : "PASS"}`,
    "",
    "## Reveal",
    "",
    `- Report A: ${mapping.A}`,
    `- Report B: ${mapping.B}`,
    "",
    "## Objective metrics",
    "",
    "```json",
    JSON.stringify(objectiveMetrics, null, 2),
    "```"
  ].join("\n");
}

function signalManifest(
  signalMarkdown: string,
  signalValidation: ReturnType<typeof validateSignalPacket>,
  inventoryCalculation?: CompleteInventoryCalculation
) {
  return {
    experiment: inventoryCalculation
      ? "dual-perspective-synastry-v3-complete-interaspect-inventory"
      : "dual-perspective-synastry-v3-direct-chart-signals",
    generatedAt,
    productionWrite: false,
    databaseMode: "read-only",
    sourceReportIds: [],
    sourceChartIds,
    sample: sample.key,
    storedAllyRelationship: sample.storedAllyRelationship,
    experimentalAllyTag: sample.experimentalAllyTag,
    toneMode: sample.toneMode,
    reportProseInput: false,
    signalSource: inventoryCalculation
      ? "buildAstrologyChartSnapshot cross-chart enumeration"
      : "buildAstrologyReportSectionEvidence",
    evidenceSelection: inventoryCalculation ? "complete-major-interaspect-inventory" : "strongest-15",
    ...(inventoryCalculation
      ? { inventoryCalculation }
      : { evidenceSelectionHeadings: evidenceHeadings }),
    chartSignalSha256: sha256(signalMarkdown),
    signalValidation
  };
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

type CompleteInventoryCalculation = {
  leftBodyCount: number;
  rightBodyCount: number;
  evaluatedBodyPairs: number;
  eligibleInteraspectCount: number;
  aspectOrbsDegrees: Record<string, number>;
};

function validateSignalPacket(
  signals: SignalPacket,
  inventoryCalculation?: CompleteInventoryCalculation
) {
  const issues: string[] = [];
  const headings = signals.map((section) => section.title);
  const bullets = signals.flatMap((section) => section.evidenceBullets);
  const uniqueLabels = new Set(bullets.map((bullet) => bullet.label));
  const interaspects = bullets.filter((bullet) => isNamedInteraspect(bullet.label));
  const uniqueInteraspects = new Set(interaspects.map((bullet) => bullet.label));
  if (!inventoryCalculation && JSON.stringify(headings) !== JSON.stringify(evidenceHeadings)) {
    issues.push("Canonical evidence-selection headings changed.");
  }
  if (inventoryCalculation && headings.length !== evidenceHeadings.length) {
    issues.push("Complete inventory lost an editorial evidence job.");
  }
  if (uniqueInteraspects.size < 12) {
    issues.push(`Direct chart packet has too few unique interaspects (${uniqueInteraspects.size}).`);
  }
  if (interaspects.some((bullet) => !/\borb \d+(?:\.\d+)? degrees\b/i.test(bullet.meaning))) {
    issues.push("A selected interaspect is missing its calculated orb.");
  }
  if (inventoryCalculation && uniqueInteraspects.size !== inventoryCalculation.eligibleInteraspectCount) {
    issues.push(
      `Complete inventory count mismatch (${uniqueInteraspects.size} of ${inventoryCalculation.eligibleInteraspectCount}).`
    );
  }
  if (bullets.some((bullet) => /\bsource report|imported report|report prose\b/i.test(`${bullet.label} ${bullet.meaning}`))) {
    issues.push("Chart packet contains report-derived prose.");
  }
  return {
    issues,
    sectionCount: signals.length,
    bulletCount: bullets.length,
    uniqueSignalCount: uniqueLabels.size,
    uniqueInteraspectCount: uniqueInteraspects.size,
    labelsBySection: Object.fromEntries(
      signals.map((section) => [
        section.title,
        section.evidenceBullets.map((bullet) => bullet.label)
      ])
    )
  };
}

function buildCompleteInteraspectInventory(request: ReturnType<typeof buildDirectSignalRequest>): {
  signals: SignalPacket;
  calculation: CompleteInventoryCalculation;
} {
  const basis = request.reportBasis;
  if (!basis || basis.schemaVersion !== 2 || basis.type !== "synastry" || !basis.partner) {
    throw new Error("Complete interaspect inventory requires a V2 synastry basis.");
  }
  const primarySnapshot = buildAstrologyChartSnapshot(request);
  const partnerRequest = astrologyReportRequestSchema.parse({
    ...request,
    id: randomUUID(),
    chartRequestId: basis.partner.chartRequestId,
    subjectName: basis.partner.subjectName,
    birthData: basis.partner.birthData,
    reportBasis: {
      ...basis,
      primary: basis.partner,
      partner: basis.primary
    }
  });
  const partnerSnapshot = buildAstrologyChartSnapshot(partnerRequest);
  const byJob = new Map<string, SignalBullet[]>(
    evidenceHeadings.map((heading) => [heading, []])
  );

  for (const left of primarySnapshot.placements.filter(isReportBody)) {
    for (const right of partnerSnapshot.placements.filter(isReportBody)) {
      const match = majorAspectMatch(Math.abs(left.angle - right.angle));
      if (!match) continue;
      const job = synastryEditorialJob(left.bodyId, right.bodyId, match.type);
      byJob.get(job)?.push({
        label: `${firstName(sample.primaryName)} ${bodyDisplayName(left.bodyId)} ${match.type} ${firstName(sample.partnerName)} ${bodyDisplayName(right.bodyId)}`,
        meaning: `${bodyDisplayName(left.bodyId)} ${match.type} ${bodyDisplayName(right.bodyId)}; ${degreeInSign(left.angle)} degrees ${left.sign}; ${degreeInSign(right.angle)} degrees ${right.sign}; orb ${match.orb} degrees`
      });
    }
  }

  const signals = evidenceHeadings.map((title) => ({
    title,
    evidenceBullets: (byJob.get(title) ?? []).sort(compareInventoryBullets)
  }));
  const eligibleInteraspectCount = signals.reduce(
    (total, section) => total + section.evidenceBullets.length,
    0
  );
  return {
    signals,
    calculation: {
      leftBodyCount: primarySnapshot.placements.filter(isReportBody).length,
      rightBodyCount: partnerSnapshot.placements.filter(isReportBody).length,
      evaluatedBodyPairs:
        primarySnapshot.placements.filter(isReportBody).length *
        partnerSnapshot.placements.filter(isReportBody).length,
      eligibleInteraspectCount,
      aspectOrbsDegrees: Object.fromEntries(majorAspectRules.map(([type, , orb]) => [type, orb]))
    }
  };
}

function isReportBody(placement: ChartSnapshot["placements"][number]) {
  return reportBodyIds.has(placement.bodyId);
}

function majorAspectMatch(distance: number) {
  const normalized = Math.min(distance, 360 - distance);
  const match = majorAspectRules.find(([, angle, orb]) => Math.abs(normalized - angle) <= orb);
  return match
    ? { type: match[0], orb: Number(Math.abs(normalized - match[1]).toFixed(1)) }
    : null;
}

function synastryEditorialJob(source: string, target: string, aspect: string) {
  const bodies = new Set([source, target]);
  const has = (...names: string[]) => names.some((name) => bodies.has(name));
  const connective = ["sextile", "trine", "conjunction"].includes(aspect);
  const tensionBearing = ["square", "opposition", "quincunx"].includes(aspect) ||
    (aspect === "conjunction" && has("mars") && has("saturn", "pluto", "chiron"));
  if (tensionBearing) return "Friction";
  if (connective && has("saturn") && has("moon", "venus", "sun")) return "Stability";
  if (connective && has("moon") && has("mercury")) return "Communication";
  if (connective && has("mercury") && !has("mars")) return "Communication";
  if (connective && has("moon", "sun", "venus", "mars", "mercury")) return "Attraction";
  if (has("saturn", "venus", "moon")) return "Stability";
  if (has("mercury", "moon")) return "Communication";
  return "Attraction";
}

function degreeInSign(angle: number) {
  return Number((((angle % 30) + 30) % 30).toFixed(2));
}

function bodyDisplayName(bodyId: string) {
  return bodyId === "chiron"
    ? "Chiron"
    : `${bodyId.slice(0, 1).toUpperCase()}${bodyId.slice(1)}`;
}

function compareInventoryBullets(left: SignalBullet, right: SignalBullet) {
  const orb = (bullet: SignalBullet) => Number(bullet.meaning.match(/orb (\d+(?:\.\d+)?) degrees/i)?.[1] ?? 99);
  return orb(left) - orb(right) || left.label.localeCompare(right.label);
}

function validatePortrait(
  markdown: string,
  signals?: SignalPacket,
  completeInventory = false
) {
  const primaryFirstName = firstName(sample.primaryName);
  const partnerFirstName = firstName(sample.partnerName);
  const expectedHeadings = expectedPortraitHeadings();
  const headings = [...markdown.matchAll(/^## (.+)$/gm)].map((match) =>
    match[1].trim()
  );
  const words = wordCount(markdown);
  const groundedSignalCount = signals ? countGroundedSignals(markdown, signals) : undefined;
  const issues: string[] = [];
  if (!/^# [^#]/m.test(markdown)) issues.push("Missing H1 title.");
  if (JSON.stringify(headings) !== JSON.stringify(expectedHeadings)) {
    issues.push("The eight-chapter heading contract was not followed exactly.");
  }
  if (words < 3_500) issues.push(`Portrait is too short (${words} words).`);
  if (words > 6_500) issues.push(`Portrait is too long (${words} words).`);
  if (nameMentions(markdown, partnerFirstName) < 20) {
    issues.push(`${partnerFirstName}'s perspective is not explicit enough.`);
  }
  if (nameMentions(markdown, primaryFirstName) < 20) {
    issues.push(`${primaryFirstName}'s perspective is not explicit enough.`);
  }
  const chapterEight = markdown.split(/^## 8\.[^\n]*$/m)[1] ?? "";
  const chapterEightWordCount = wordCount(chapterEight);
  if (chapterEightWordCount < 400) issues.push(`Chapter 8 is underdeveloped (${chapterEightWordCount} words).`);
  if (groundedSignalCount !== undefined && groundedSignalCount < 8) {
    issues.push(`Portrait visibly grounds too few supplied signals (${groundedSignalCount}).`);
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
    issues.push("Portrait discusses a Yod without a supplied Yod signal.");
  }
  const rawCalculationClaims = [
    ...markdown.matchAll(/[°º]|\borb\b|\bdegrees?\b|\bnear-exact\b|\bnearly exact\b|\balmost exact\b|\b(?:tight|close) enough\b/gi)
  ].map((match) => match[0]);
  if (rawCalculationClaims.length) {
    issues.push("Portrait reproduces raw degree or orb calculation trace.");
  }
  const romanticLanguageClaims = sample.toneMode === "family-caregiving-child"
    ? [...markdown.matchAll(/\b(?:romantic|romance|sexual|erotic|lover|sensual|chemistry|attraction)\b/gi)].map((match) => match[0])
    : [];
  if (romanticLanguageClaims.length) {
    issues.push("Child portrait uses prohibited romantic or sexual language.");
  }
  if (sample.toneMode === "lover-romantic-sexual") {
    const opening = markdown.slice(0, 2_000);
    if (!/\bromantic\b/i.test(opening) || !/\bsexual\b/i.test(opening)) {
      issues.push("Lover portrait does not lead with both romantic and sexual overtones.");
    }
  }
  const contributionLedgerClaims = [
    ...markdown.matchAll(/\b(?:load-bearing|provid(?:e|es|ing) the floor|gives? more.{0,80}receives?|more architecture.{0,80}receives?|costs? (?:him|her|them) ongoing effort)\b/gi)
  ].map((match) => match[0]);
  if (contributionLedgerClaims.length) {
    issues.push("Portrait assigns comparative relational labor from chart evidence.");
  }
  const unexpectedScriptClaims = [...markdown.matchAll(/[\p{Script=Han}]/gu)].map((match) => match[0]);
  if (unexpectedScriptClaims.length) issues.push("English portrait contains unexpected non-Latin copy artifacts.");
  if (completeInventory) {
    contributionLedgerClaims.push(
      ...[
        /costs are not evenly distributed/gi,
        /did (?:very )?little to earn/gi,
        /without reciprocating at the same volume/gi,
        /doing enormous labor/gi,
        /less structural nourishment/gi,
        /low cost to himself/gi,
        /by her own effort/gi,
        /comparatively less visited/gi
      ].flatMap((pattern) => markdown.match(pattern) ?? [])
    );
  }
  if (contributionLedgerClaims.length) {
    if (!issues.includes("Portrait assigns comparative relational labor from chart evidence.")) {
      issues.push("Complete-inventory portrait turns contact volume into a comparative contribution ledger.");
    }
  }
  return {
    issues,
    wordCount: words,
    chapterHeadings: headings,
    groundedSignalCount,
    contributionLedgerClaims,
    rawCalculationClaims,
    romanticLanguageClaims,
    unexpectedScriptClaims,
    chapterEightWordCount,
    mentions: {
      [partnerFirstName]: nameMentions(markdown, partnerFirstName),
      [primaryFirstName]: nameMentions(markdown, primaryFirstName),
      relationship: (markdown.match(/\brelationship\b/gi) ?? []).length
    }
  };
}

function expectedPortraitHeadings() {
  const primaryFirstName = firstName(sample.primaryName);
  const partnerFirstName = firstName(sample.partnerName);
  if (sample.toneMode === "family-caregiving-child") {
    return [
      "1. The Recognition",
      `2. ${primaryFirstName} Inside ${partnerFirstName}`,
      `3. ${partnerFirstName} Inside ${primaryFirstName}`,
      "4. Safety, Attachment, and Trust",
      "5. Will, Friction, and Repair",
      "6. Communication and Emotional Translation",
      "7. Care, Autonomy, and the Growing Edge",
      "8. The Family Bond as a Living System"
    ];
  }
  return [
    "1. The Recognition",
    `2. ${primaryFirstName} Inside ${partnerFirstName}`,
    `3. ${partnerFirstName} Inside ${primaryFirstName}`,
    "4. The Spell and the Projection",
    "5. Desire, Anger, and Pursuit",
    "6. The Love Language Under Pressure",
    "7. The Shadow Bargain",
    "8. The Relationship as a Third Being"
  ];
}

function toneInstruction() {
  if (sample.toneMode === "family-caregiving-child") {
    return "Tone mode: family-caregiving-child. Romantic, sexual, erotic, lover, sensual, chemistry, and attraction language is prohibited. Do not use those words even to deny or contrast them. Begin directly from kinship and family recognition. Do not infer Marissa's age or developmental stage. Center attachment, care, trust, autonomy, communication, family roles, and repair without assigning adult emotional labor to the child or judging Tony's parenting.";
  }
  if (sample.toneMode === "lover-romantic-sexual") {
    return "Tone mode: lover-romantic-sexual. Lead the title, deck, and opening chapter with romantic and sexual overtones grounded in the supplied interaspects. The opening must explicitly use both words, romantic and sexual, naturally. Make attraction, chemistry, and embodied charge central without converting symbolism into consent, exclusivity, commitment, permanence, verified sexual history, or destiny.";
  }
  return "Tone mode: adult-romantic spouse. Romantic, erotic, and sexual-attraction themes are allowed only when supported by supplied interaspects. Do not infer monogamy, permanence, relationship satisfaction, marriage history, or a stay/leave conclusion from the Spouse tag.";
}

function candorInstruction() {
  if (sample.toneMode === "family-caregiving-child") {
    return "Be emotionally candid and interesting. Do not sand down contradiction, anger, projection, authority, dependency, attachment, or differences in how parent and child may experience the bond. Do not rank who contributes, earns, carries, gives, or receives more, and never assign responsibility for the adult's regulation to the child.";
  }
  return "Be emotionally candid and interesting. Do not sand down contradiction, desire, anger, projection, power, dependency, erotic charge, or differences in how each person may experience relational effort. Do not rank who contributes, earns, carries, gives, or receives more.";
}

function chapterEvidenceInstructions() {
  if (sample.toneMode === "family-caregiving-child") {
    return "Build Chapter 4 from supplied emotional-safety, permeability, attachment, and trust signals. Build Chapters 5 and 6 from supplied conflict/will and communication/emotional signals respectively. Build Chapter 7 from care, authority, autonomy, and developmental room without inferring age, assigning burden to Marissa, or issuing a parenting verdict. Build Chapter 8 only by synthesizing reciprocal interaspects as a family-bond pattern.";
  }
  return "Build Chapter 4 only from supplied signals that support idealization, ambiguity, permeability, or projection. Build Chapters 5 and 6 from supplied desire/conflict and communication/emotional signals respectively. Build Chapter 7 from differences in lived experience, power, or cost within the supplied interaspects. Keep them as hypotheses and do not turn aspect counts or one person's contacted planets into a verdict about who carries, earns, gives, or receives more. Build Chapter 8 only by synthesizing reciprocal interaspects as a relationship pattern.";
}

function countGroundedSignals(markdown: string, signals: SignalPacket) {
  const paragraphs = markdown.split(/\n\s*\n/).map((paragraph) => paragraph.toLowerCase());
  const labels = new Set(
    signals
      .flatMap((section) => section.evidenceBullets)
      .map((bullet) => parseInteraspect(bullet))
      .filter((signal): signal is NonNullable<ReturnType<typeof parseInteraspect>> => Boolean(signal))
      .map((signal) => JSON.stringify(signal))
  );
  return [...labels].filter((encoded) => {
    const signal = JSON.parse(encoded) as ReturnType<typeof parseInteraspect>;
    if (!signal) return false;
    return paragraphs.some((paragraph) =>
      paragraph.includes(signal.leftName.toLowerCase()) &&
      paragraph.includes(signal.leftBody.toLowerCase()) &&
      paragraph.includes(signal.aspectStem) &&
      paragraph.includes(signal.rightName.toLowerCase()) &&
      paragraph.includes(signal.rightBody.toLowerCase())
    );
  }).length;
}

function isNamedInteraspect(label: string) {
  return Boolean(parseInteraspect({ label, meaning: "" }));
}

function parseInteraspect(bullet: SignalBullet) {
  const primaryFirstName = escapeRegex(firstName(sample.primaryName));
  const partnerFirstName = escapeRegex(firstName(sample.partnerName));
  const match = bullet.label.match(
    new RegExp(`^(${primaryFirstName}|${partnerFirstName}) (Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron) (conjunction|opposition|square|trine|sextile|quincunx) (${primaryFirstName}|${partnerFirstName}) (Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)$`)
  );
  if (!match) return null;
  return {
    leftName: match[1],
    leftBody: match[2],
    aspectStem: match[3] === "opposition" ? "oppos" : match[3] === "conjunction" ? "conj" : match[3].slice(0, 5),
    rightName: match[4],
    rightBody: match[5]
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

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || value.trim();
}

function chartRelationship(chart: ChartMakerRequest) {
  const subject = chart.context?.subject;
  return subject && typeof subject.relationship === "string" ? subject.relationship.trim() : "";
}

function nameMentions(markdown: string, name: string) {
  return (markdown.match(new RegExp(`\\b${escapeRegex(name)}\\b`, "g")) ?? []).length;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
