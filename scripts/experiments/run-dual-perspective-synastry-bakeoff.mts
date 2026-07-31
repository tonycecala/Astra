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

const cheyenneChartId = "v1-chart:4f42aa82-c5fd-41d2-96b6-7f9143ace78c";
const tonyChartId = "0fac9ad6-6ccd-4a30-ac0b-480892254f0f";
const sourceChartIds = [cheyenneChartId, tonyChartId];
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
const apiKey =
  clean(process.env.ASTRA_OPENROUTER_API_KEY) ||
  clean(process.env.OPENROUTER_API_KEY);

if (process.argv.includes("--help")) {
  console.log("Generate one private, direct-chart-signal Dual-Perspective Synastry Portrait.");
  console.log("Generation: --generate [--complete-inventory] [--output].");
  console.log("Signals only: --signals-only [--complete-inventory] [--output].");
  console.log("Validation only: --validate <portrait.md>.");
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
  const signalMarkdown = renderSignalPacket(signals, completeInventory);

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
  const cheyenne = charts.find((chart) => chart.id === cheyenneChartId);
  const tony = charts.find((chart) => chart.id === tonyChartId);
  if (!cheyenne || !tony) throw new Error("Tony and Cheyenne source charts are required.");
  if (cheyenne.userId !== tony.userId) throw new Error("Source charts must share an owner.");
  return astrologyReportRequestSchema.parse({
    id: randomUUID(),
    userId: cheyenne.userId,
    chartRequestId: cheyenne.id,
    reportType: "synastry",
    subjectName: "Cheyenne Autumn + Tony Cecala",
    birthData: cheyenne.birthData,
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
        chartRequestId: cheyenne.id,
        subjectType: "ally",
        subjectId: cheyenne.id,
        subjectName: "Cheyenne Autumn",
        birthData: cheyenne.birthData,
        calculationMode: "full"
      },
      partner: {
        chartRequestId: tony.id,
        subjectType: "self",
        subjectId: tony.userId,
        subjectName: "Tony Cecala",
        birthData: tony.birthData,
        calculationMode: "full"
      }
    },
    createdAt: generatedAt,
    updatedAt: generatedAt
  });
}

function renderSignalPacket(signals: SignalPacket, completeInventory: boolean) {
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
      ...section.evidenceBullets.map((bullet) => `- ${bullet.label}: ${bullet.meaning}`),
      ""
    ])
  ].join("\n").trim();
}

function buildPrompt(signalMarkdown: string, completeInventory: boolean) {
  const packetContract = completeInventory
    ? `The packet is the complete calculated inventory of supported major interaspects between Astra's standard report bodies. Do not treat contact count as a vote, give wide-orb or outer-planet contacts equal weight by default, or force every contact into the portrait. Select load-bearing evidence by exactness, personal-planet relevance, recurrence, and explanatory value. The inventory excludes house overlays, angles, nodes, asteroids, midpoints, Yods, composite charts, and Davison charts; do not infer anything about those excluded systems.`
    : `The packet is a curated selection of the strongest contacts, not an exhaustive list. Never infer that an unlisted reciprocal contact does not exist, and never rank which person contributes more by treating omitted signals as negative evidence.`;
  return `You are Astra's premium psychological-astrology portrait writer.

Write one experimental Dual-Perspective Synastry Portrait for Tony Cecala and Cheyenne Autumn. This is a private shadow-generation bakeoff, not a production report.

Purpose:
- Produce psychologically dense, specific, restrained, literary writing without relying on any prior report prose.
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

Write an H1 title before Chapter 1 and a short italic deck that states the portrait's central thesis. Do not add any other H2 sections. Target 4,200-5,800 words total, with fully developed chapters rather than padded repetition.

Perspective discipline:
- When describing Tony's experience, explicitly say Tony and ground the claim in contacts to Tony's chart.
- When describing Cheyenne's experience, explicitly say Cheyenne and ground the claim in contacts to Cheyenne's chart.
- When describing the relationship as a third being, clearly label it as a synthesis of reciprocal interaspects. Do not invent a composite or Davison chart.
- Do not flatten reciprocal aspects into identical experiences. The same contact can land differently on the planet person and the planet receiving it.
- Treat interpretations as chart-grounded possibilities, not verified biography. Avoid generic advice, therapy language, safety disclaimers, and canned compatibility verdicts.

Evidence contract:
- The chart-signal packet below is the only astrological evidence supplied. Use no aspect, placement, house, angle, node, asteroid, midpoint, Yod, composite chart, or Davison claim that is absent from it.
- Do not import a conclusion from an earlier report; none is provided.
- ${packetContract}
- An interaspect is reciprocal even when its two people experience the contacted planets differently. Do not describe the aspect itself as energy flowing only one way.
- The four packet headings are evidence-selection jobs, not the required output structure. Recompose their signals across the eight chapters.
- Build Chapters 2 and 3 from how the same interaspects land differently for each named person.
- Build Chapter 4 only from supplied signals that support idealization, ambiguity, permeability, or projection.
- Build Chapters 5 and 6 from supplied desire/conflict and communication/emotional signals respectively.
- Build Chapter 7 from asymmetries, power, cost, or unequal relational work within the supplied interaspects, while keeping those interpretations as hypotheses rather than verdicts about who carries the whole relationship.
- Build Chapter 8 only by synthesizing reciprocal interaspects as a relationship pattern.
- If a desired theme is not supported by a supplied signal, omit that theme rather than filling the gap.

<chart_signals>
${signalMarkdown}
</chart_signals>

Return only the finished Markdown portrait.`;
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
  const cheyenneSnapshot = buildAstrologyChartSnapshot(request);
  const tonyRequest = astrologyReportRequestSchema.parse({
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
  const tonySnapshot = buildAstrologyChartSnapshot(tonyRequest);
  const byJob = new Map<string, SignalBullet[]>(
    evidenceHeadings.map((heading) => [heading, []])
  );

  for (const left of cheyenneSnapshot.placements.filter(isReportBody)) {
    for (const right of tonySnapshot.placements.filter(isReportBody)) {
      const match = majorAspectMatch(Math.abs(left.angle - right.angle));
      if (!match) continue;
      const job = synastryEditorialJob(left.bodyId, right.bodyId, match.type);
      byJob.get(job)?.push({
        label: `Cheyenne ${bodyDisplayName(left.bodyId)} ${match.type} Tony ${bodyDisplayName(right.bodyId)}`,
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
      leftBodyCount: cheyenneSnapshot.placements.filter(isReportBody).length,
      rightBodyCount: tonySnapshot.placements.filter(isReportBody).length,
      evaluatedBodyPairs:
        cheyenneSnapshot.placements.filter(isReportBody).length *
        tonySnapshot.placements.filter(isReportBody).length,
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
  const groundedSignalCount = signals ? countGroundedSignals(markdown, signals) : undefined;
  const issues: string[] = [];
  if (!/^# [^#]/m.test(markdown)) issues.push("Missing H1 title.");
  if (JSON.stringify(headings) !== JSON.stringify(expectedHeadings)) {
    issues.push("The eight-chapter heading contract was not followed exactly.");
  }
  if (words < 3_500) issues.push(`Portrait is too short (${words} words).`);
  if (words > 6_500) issues.push(`Portrait is too long (${words} words).`);
  if ((markdown.match(/\bTony\b/g) ?? []).length < 20) {
    issues.push("Tony's perspective is not explicit enough.");
  }
  if ((markdown.match(/\bCheyenne\b/g) ?? []).length < 20) {
    issues.push("Cheyenne's perspective is not explicit enough.");
  }
  if ((markdown.match(/\brelationship\b/gi) ?? []).length < 12) {
    issues.push("The relationship-as-third-being perspective is underdeveloped.");
  }
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
  const contributionLedgerClaims = completeInventory
    ? [
        /costs are not evenly distributed/gi,
        /did (?:very )?little to earn/gi,
        /without reciprocating at the same volume/gi,
        /doing enormous labor/gi,
        /less structural nourishment/gi,
        /low cost to himself/gi,
        /by her own effort/gi,
        /comparatively less visited/gi
      ].flatMap((pattern) => markdown.match(pattern) ?? [])
    : [];
  if (contributionLedgerClaims.length) {
    issues.push(
      "Complete-inventory portrait turns contact volume into a comparative contribution ledger."
    );
  }
  return {
    issues,
    wordCount: words,
    chapterHeadings: headings,
    groundedSignalCount,
    contributionLedgerClaims,
    mentions: {
      Tony: (markdown.match(/\bTony\b/g) ?? []).length,
      Cheyenne: (markdown.match(/\bCheyenne\b/g) ?? []).length,
      relationship: (markdown.match(/\brelationship\b/gi) ?? []).length
    }
  };
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
  const match = bullet.label.match(
    /^(Cheyenne|Tony) (Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron) (conjunction|opposition|square|trine|sextile|quincunx) (Cheyenne|Tony) (Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)$/
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

async function createPrivateDirectory(path: string) {
  await mkdir(path, { recursive: true, mode: 0o700 });
  await chmod(path, 0o700);
}

async function writePrivate(path: string, content: string) {
  await createPrivateDirectory(dirname(path));
  await writeFile(path, content, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}
