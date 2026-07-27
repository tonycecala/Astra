import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import {
  OPENROUTER_DEFAULT_BASE_URL,
  buildAstrologyMeaningComplexNetwork,
  buildAstrologyMeaningComplexReportViews,
  buildAstrologyReportSectionEvidence,
  reportModelProfileModels
} from "@astra/astrology";
import {
  astrologyReportRequestSchema,
  hasResolvedBirthCoordinates
} from "@astra/contracts";
import { closeDatabaseConnection, db, exportPortableUserData } from "@astra/db";

type JsonObject = Record<string, unknown>;
type EvidenceBullet = { label: string; meaning: string };
type RecordedAttempt = {
  attempt: number;
  body: string;
  issues: string[];
  usage: unknown;
};
type BlockerKey = "relationships-lunar-chain" | "blind-spots-privileged-perception";

const bodyName = "(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)";
const genericChainPattern = new RegExp(
  String.raw`\bdispositor chains?\b|\b(?:rulership|dispositor)\s+(?:chain|sequence)\b|\b(?:the|this|a)\s+chain\s+(?:tracing|leading|running|ending|going)\s+(?:back\s+)?(?:to|through|from)\s+${bodyName}\b`,
  "i"
);
const inventedBiographyPattern = /\b(?:you(?:'|’)ve likely lived through|you have likely lived through|you learned early|learned to compensate|growing up|in (?:your )?childhood|throughout your career|in past relationships|your early home life|a family pattern|old wound|defensive (?:reaction|pattern|strategy))\b/i;
const categoricalBehaviorPattern = /\b(?:you act before you think|you react before you think|you (?:always|usually|never) (?:know|sense|see|read|react|act|withdraw|overcommit)|you are (?:the kind|the type|someone) who|your instinct is to)\b/i;
const otherPersonInnerStatePattern = /\b(?:another person|someone else|the other person)(?:'s|’s)?\s+(?:motive|mood|need|fear|intention|reaction|response|inner life)\b|\b(?:what|how)\s+(?:another person|someone else|they)\s+(?:want|wants|feel|feels|think|thinks|need|needs)\b/i;
const unsupportedElsewhereEvidencePattern = /\b(?:counterevidence|placements?|aspects?|signals?)\b[^.!?]{0,120}\belsewhere\b|\belsewhere in (?:the|your) chart\b/i;
const moonRulesSeventhPattern = /\bMoon\s+rules\s+(?:your\s+|the\s+)?(?:7th|seventh)\s+house\b/i;
const moonAnchorPattern = /\bMoon\s+(?:is|sits|stands|falls|placed|located)?\s*(?:in\s+)?Pisces\b/i;
const plutoAnchorPattern = /\bPluto\s+(?:is|sits|stands|falls|placed|located)?\s*(?:in\s+)?Scorpio\b/i;
const neptunePlutoSextilePattern = /\b(?:Neptune\s+(?:sextiles?|sextile)\s+Pluto|Pluto\s+(?:sextiles?|sextile)\s+Neptune)\b/i;
const privilegedPerceptionPattern = /\b(?:sharpens?|gives|offers|provides)\s+(?:you|your).{0,35}\b(?:read|sense)\s+(?:of|on)\s+(?:(?:hidden|social|group|unspoken)\s+){0,2}(?:undercurrents|signals|dynamics|people)\b|\b(?:sense|read|pick up on)\s+(?:(?:hidden|social|group|unspoken)\s+){1,2}(?:undercurrents|signals|dynamics)\b|\b(?:shapes?|influences?|guides?)\s+how\s+you\s+(?:read|sense)\s+(?:a\s+room|a\s+(?:friend\s+)?group|people|social\s+dynamics)\b|\bfirst impression\s+(?:can|may|might)?\s*(?:feel|seem)\s+(?:complete|convincing|certain|accurate)\b|\b(?:feeling|sense)\s+of\s+knowing\s+(?:can|may|might)?\s*(?:arrive|come)\s+(?:fast|quickly|immediately)\b/i;
const unnecessaryOrbPrecisionPattern = /\b(?:orb(?:\s+of)?|(?:under|within|nearly|less than)\s+(?:one|\d+(?:\.\d+)?)\s+degrees?|degrees?\s+(?:apart|from exact)|exact\s+(?:aspect|trine|square|opposition|sextile|conjunction|quincunx))\b/i;
const currentActivationPattern = /\b(?:currently|right now|this season|present pressure|current timing|current activation)\b/i;
const explicitClaimNegationPattern = /\b(?:does not|doesn't|do not|don't|is not|isn't|are not|aren't|cannot|can't|never|no proof|not evidence|not confirmation|does nothing to prove|not that|not currently)\b/i;
const perceptionRebuttalTermPattern = /\b(?:read|sense|perceiv\w*|accura\w*|certain\w*|first impressions?|undercurrents?|hidden dynamics?|social radar|instinctive insight)\b/gi;

const blockerKey = (option("--blocker") || "relationships-lunar-chain") as BlockerKey;
const controls = {
  "relationships-lunar-chain": {
    chapter: "Relationships",
    artifact: "marissa-relationships-lunar-chain",
    reportFile: "marissa-relationships.md",
    label: "Marissa Relationships lunar-chain narration blocker"
  },
  "blind-spots-privileged-perception": {
    chapter: "Blind Spots",
    artifact: "marissa-blind-spots-privileged-perception",
    reportFile: "marissa-blind-spots.md",
    label: "Marissa Blind Spots privileged-perception blocker"
  }
} as const;
const control = controls[blockerKey];
if (!control) throw new Error(`Unsupported blocker: ${blockerKey}`);

if (blockerKey === "relationships-lunar-chain") {
  for (const value of [
    "The chain tracing back to Chiron suggests this reciprocity pattern is not automatic or fully settled.",
    "The dispositor chain carries the Moon's meaning through several planets.",
    "This rulership sequence ends at Saturn and explains the wider pattern."
  ]) {
    if (!genericChainPattern.test(value)) throw new Error(`Validator preflight missed invalid chain narration: ${value}`);
  }
  for (const value of [
    "The Moon is disposed by Jupiter.",
    "Jupiter is the Moon's dispositor.",
    "Saturn is the final dispositor."
  ]) {
    if (genericChainPattern.test(value)) throw new Error(`Validator preflight rejected valid direct rulership: ${value}`);
  }
} else {
  for (const value of [
    "Pluto's intensity can shape how you read a room or friend group.",
    "Neptune sextile Pluto can make a first impression feel complete and convincing.",
    "The feeling of knowing can arrive fast."
  ]) {
    if (!privilegedPerceptionPattern.test(value)) throw new Error(`Validator preflight missed privileged perception: ${value}`);
  }
  for (const value of [
    "Pluto in the eleventh house may make group matters feel important.",
    "Neptune sextile Pluto does not establish accurate perception.",
    "A strong impression is not proof of accuracy."
  ]) {
    if (privilegedPerceptionPattern.test(value)) throw new Error(`Validator preflight rejected bounded perception language: ${value}`);
  }
}

const generationApproved = process.argv.includes("--generate");
const email = option("--email") || "astramaster@tony.io";
const model = option("--model") || reportModelProfileModels.production[0];
const packetDir = resolve(
  option("--packet") ||
    ".astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10"
);
const outputDir = join(packetDir, "blockers", control.artifact);
const apiKey = clean(process.env.ASTRA_OPENROUTER_API_KEY) || clean(process.env.OPENROUTER_API_KEY);

if (!generationApproved) throw new Error(`Use --generate to approve the single Marissa ${control.chapter} chapter call.`);
if (!apiKey) throw new Error("ASTRA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is required.");
if (!reportModelProfileModels.production.includes(model as (typeof reportModelProfileModels.production)[number])) {
  throw new Error(`Use an approved production report model. Received: ${model}`);
}

await mkdir(outputDir, { recursive: true, mode: 0o700 });

try {
  const bundle = await exportPortableUserData(db, {
    email,
    sourceLabel: `semantic-synthesis-v2-phase-5-${control.artifact}`
  });
  const chart = [...bundle.data.chartRequests]
    .filter((candidate) =>
      candidate.subjectName === "Marissa Yahil" &&
      candidate.source === "ally" &&
      candidate.status === "completed"
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  if (!chart) throw new Error("No completed Marissa Yahil ally chart was found.");
  if (!hasResolvedBirthCoordinates(chart.birthData)) {
    throw new Error("Marissa Yahil does not have resolved birth coordinates.");
  }

  const settings = recordFrom(recordFrom(chart.context).chartSettings);
  const zodiacMode = textFrom(settings.zodiacMode) || "tropical";
  const houseSystem = textFrom(settings.houseSystem) || "whole-sign";
  if (!new Set(["tropical", "sidereal"]).has(zodiacMode)) throw new Error("Marissa has invalid Zodiac settings.");
  if (!new Set(["whole-sign", "placidus"]).has(houseSystem)) throw new Error("Marissa has invalid house settings.");

  const coreReport = await readFile(join(packetDir, "reports", "marissa-yahil-core-v2.md"), "utf8");
  const canonicalIdentity = markdownSection(coreReport, "Identity");
  if (!canonicalIdentity) throw new Error("Marissa canonical Identity was not found in the Phase 5 packet.");

  const now = new Date().toISOString();
  const request = astrologyReportRequestSchema.parse({
    id: randomUUID(),
    userId: chart.userId,
    chartRequestId: chart.id,
    reportType: "deep",
    subjectName: "Marissa Yahil",
    birthData: chart.birthData,
    question: "What does this natal chart show when each life area is synthesized from its strongest evidence?",
    intent: `Semantic Synthesis V2 Phase 5.1 targeted ${control.label}.`,
    context: {
      relationshipContext: {
        status: "unspecified",
        condition: "unspecified",
        structure: "unspecified",
        intention: "unspecified",
        recency: "unspecified",
        partnerPronouns: null,
        notes: null
      },
      canonicalIdentity
    },
    source: "ally",
    boundary: "private",
    status: "queued",
    costCredits: 10,
    reportBasis: {
      schemaVersion: 2,
      type: "natal",
      chartSettings: { zodiacMode, houseSystem },
      primary: {
        chartRequestId: chart.id,
        subjectType: "ally",
        subjectId: chart.id,
        subjectName: "Marissa Yahil",
        birthData: chart.birthData,
        calculationMode: "full"
      }
    },
    createdAt: now,
    updatedAt: now
  });

  const headings = [
    "Identity",
    "Emotions",
    "Relationships",
    "Work",
    "Drive",
    "Gifts",
    "Blind Spots",
    "Growth",
    "Integration"
  ] as const;
  const network = buildAstrologyMeaningComplexNetwork(request);
  const views = buildAstrologyMeaningComplexReportViews(request);
  const selection = views?.deep.chapters.find((chapter) => chapter.title === control.chapter);
  const evidence = buildAstrologyReportSectionEvidence(request, headings)
    .find((chapter) => chapter.title === control.chapter);
  if (!selection || !evidence) throw new Error(`Marissa ${control.chapter} selection or evidence was not built.`);
  const primary = network.complexes.find((complex) => complex.id === selection.primaryComplexId);
  if (!primary) throw new Error(`Marissa ${control.chapter} primary meaning complex was not found.`);

  const exposedChainEvidence = evidence.evidenceBullets.filter((bullet) =>
    /\bdispositor-chain\b/i.test(`${bullet.label} ${bullet.meaning}`)
  );
  if (exposedChainEvidence.length) {
    throw new Error(`Generic chain evidence remains writer-facing: ${JSON.stringify(exposedChainEvidence)}`);
  }
  if (blockerKey === "relationships-lunar-chain" &&
    !evidence.evidenceBullets.some((bullet) => /\bMoon rules 7th house\b/i.test(bullet.meaning))) {
    throw new Error(`The Moon's seventh-house rulership is absent from Relationships evidence: ${JSON.stringify(evidence.evidenceBullets)}`);
  }
  if (blockerKey === "blind-spots-privileged-perception") {
    if (!evidence.evidenceBullets.some((bullet) => /\bPluto in Scorpio\b/i.test(bullet.meaning))) {
      throw new Error(`The Pluto anchor is absent from Blind Spots evidence: ${JSON.stringify(evidence.evidenceBullets)}`);
    }
    if (!evidence.evidenceBullets.some((bullet) => /\bneptune sextile pluto\b/i.test(`${bullet.label} ${bullet.meaning}`))) {
      throw new Error(`The Neptune-Pluto sextile is absent from Blind Spots evidence: ${JSON.stringify(evidence.evidenceBullets)}`);
    }
    if (evidence.evidenceBullets.some((bullet) => unnecessaryOrbPrecisionPattern.test(bullet.meaning))) {
      throw new Error(`Unnecessary orb precision remains in Blind Spots evidence: ${JSON.stringify(evidence.evidenceBullets)}`);
    }
  }

  const evidencePacket = {
    subject: request.subjectName,
    chapter: control.chapter,
    primaryComplexId: selection.primaryComplexId,
    mechanism: primary.mechanism,
    hypothesis: primary.hypothesis,
    claimBoundary: primary.claimBoundary,
    interpretiveJob: selection.interpretiveJob,
    evidenceBullets: evidence.evidenceBullets
  };
  await writePrivate(join(outputDir, "selected-evidence.json"), `${JSON.stringify(evidencePacket, null, 2)}\n`);

  const attemptsPath = join(outputDir, "generation-attempts.json");
  const attempts = await readAttempts(attemptsPath);
  for (const attempt of attempts) attempt.issues = validateChapter(attempt.body, evidence.evidenceBullets, blockerKey);

  let acceptedBody = "";
  let acceptedAttemptNumber: number | null = null;
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (!attempts[index]!.issues.length) {
      acceptedBody = attempts[index]!.body;
      acceptedAttemptNumber = attempts[index]!.attempt;
      break;
    }
  }

  let previousIssues = attempts.at(-1)?.issues ?? [];
  const firstNewAttempt = attempts.length + 1;
  const maxNewAttempts = blockerKey === "blind-spots-privileged-perception" ? 1 : 2;
  for (let attempt = firstNewAttempt; !acceptedBody && attempt < firstNewAttempt + maxNewAttempts; attempt += 1) {
    const response = await generateChapter(buildPrompt(evidencePacket, previousIssues));
    const body = normalizeBody(response.text);
    const recorded: RecordedAttempt = { attempt, body, issues: [], usage: response.usage };
    attempts.push(recorded);
    await writePrivate(attemptsPath, `${JSON.stringify(attempts, null, 2)}\n`);
    recorded.issues = validateChapter(body, evidence.evidenceBullets, blockerKey);
    await writePrivate(attemptsPath, `${JSON.stringify(attempts, null, 2)}\n`);
    if (!recorded.issues.length) {
      acceptedBody = body;
      acceptedAttemptNumber = attempt;
      break;
    }
    previousIssues = recorded.issues;
  }

  const decision = acceptedBody ? "PASS" : "HOLD";
  const modelSpend = attempts.reduce((sum, attempt) => sum + usageCost(attempt.usage), 0);
  if (acceptedBody) {
    await writePrivate(
      join(outputDir, control.reportFile),
      `# Marissa Yahil — Deep ${control.chapter} targeted control\n\n## ${control.chapter}\n\n${acceptedBody}\n`
    );
  }
  await writePrivate(
    join(outputDir, "decision.md"),
    [
      `# ${control.label}`,
      "",
      `Decision: ${decision}`,
      "",
      `- Recorded generation attempts: ${attempts.length}`,
      `- Accepted recorded attempt: ${acceptedAttemptNumber ?? "none"}`,
      `- Known model spend: $${modelSpend.toFixed(6)}`,
      `- Scope: ${control.chapter} chapter only`,
      "- Complete Deep reports generated: 0",
      "- Other subjects generated: 0",
      "- Validator preflight against known failure and paraphrases: PASS",
      `- Generic chain evidence omitted: ${exposedChainEvidence.length === 0 ? "PASS" : "FAIL"}`,
      `- Targeted semantic overreach omitted: ${acceptedBody && targetedOverreachPass(acceptedBody, blockerKey) ? "PASS" : "FAIL"}`,
      `- Required chapter anchors retained: ${acceptedBody && requiredAnchorsPass(acceptedBody, blockerKey) ? "PASS" : "FAIL"}`,
      `- Unsupported biography: ${acceptedBody && !inventedBiographyPattern.test(acceptedBody) ? "PASS" : "FAIL"}`,
      `- Categorical behavior: ${acceptedBody && !categoricalBehaviorPattern.test(acceptedBody) ? "PASS" : "FAIL"}`,
      `- Another-person inner state: ${acceptedBody && !otherPersonInnerStatePattern.test(acceptedBody) ? "PASS" : "FAIL"}`,
      `- Unselected evidence from elsewhere in the chart: ${acceptedBody && !unsupportedElsewhereEvidencePattern.test(acceptedBody) ? "PASS" : "FAIL"}`,
      "",
      decision === "PASS"
        ? `The targeted ${control.chapter} chapter follows the current evidence without the documented ${blockerKey} overreach.`
        : `The blocker remains unresolved: ${attempts.at(-1)?.issues.join("; ") || "no accepted chapter"}.`
    ].join("\n") + "\n"
  );

  console.log(JSON.stringify({
    decision,
    attempts: attempts.length,
    outputDir,
    completeDeepReportsGenerated: 0,
    otherSubjectsGenerated: 0,
    finalIssues: acceptedBody ? [] : attempts.at(-1)?.issues ?? []
  }, null, 2));
  if (!acceptedBody) process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}

function buildPrompt(
  evidence: {
    subject: string;
    chapter: string;
    hypothesis: string;
    claimBoundary: string;
    interpretiveJob: string;
    evidenceBullets: EvidenceBullet[];
  },
  previousIssues: string[]
) {
  const blockerInstructions = blockerKey === "relationships-lunar-chain"
    ? [
        "State only direct rulership facts supplied below. Do not mention or infer any rulership chain, dispositor chain, sequence, endpoint, or chain relationship to Chiron.",
        "Do not turn daily communication into a required frequency, a likely reaction to silence, or a biography about texting, calls, or relationships.",
        "Keep examples generic and conditional. Do not assume another person, partner, conflict, or current relationship.",
        "Use at least two selected signals. Include the Moon in Pisces in the 3rd house and the direct fact that the Moon rules the 7th house while remaining placed in the 3rd house."
      ]
    : [
        "Treat Pluto as symbolically important within the selected life area. Keep every personal application conditional and grounded in observable information.",
        "Keep the 11th-house application neutral: group, friendship, or shared-cause matters may carry symbolic weight.",
        "Build the chapter around two distinctions: symbolic importance is not biography, and counterevidence keeps an interpretation provisional.",
        "Treat groups only as life-area context. Do not include examples about evaluating people or group dynamics.",
        "Use at least two selected signals. Include Pluto in Scorpio in the 11th house and Neptune sextile Pluto without orb narration."
      ];
  return [
    `Write only the body of one Astra Deep ${evidence.chapter} chapter in plain Markdown.`,
    "Do not write a heading, report title, evidence block, JSON, or another chapter.",
    "Target 275-400 words.",
    `Subject: ${evidence.subject}. Address the reader as you.`,
    `Chapter job: ${evidence.interpretiveJob}.`,
    `Bounded hypothesis: ${evidence.hypothesis}`,
    `Claim boundary: ${evidence.claimBoundary}`,
    "Use only the selected evidence below. Personal descriptions must be measured possibilities, not established behavior.",
    "Do not invent biography, history, routines, relationship status, another person's inner state, current timing, or a proven skill.",
    ...blockerInstructions,
    "Selected evidence:",
    ...evidence.evidenceBullets.map((bullet) => `- ${bullet.label}: ${bullet.meaning}`),
    previousIssues.length ? "The previous attempt failed. Correct every issue:" : "",
    ...previousIssues.map((issue) => `- ${constructiveRetryGuidance(issue)}`)
  ].filter(Boolean).join("\n");
}

async function generateChapter(prompt: string) {
  const response = await fetch(`${OPENROUTER_DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1400,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: unknown;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(payload.error?.message || `OpenRouter failed with ${response.status}.`);
  const text = payload.choices?.[0]?.message?.content;
  if (!text?.trim()) throw new Error(`OpenRouter returned no ${control.chapter} prose.`);
  return { text, usage: payload.usage ?? null };
}

function validateChapter(body: string, bullets: EvidenceBullet[], activeBlocker: BlockerKey) {
  const issues: string[] = [];
  const words = wordCount(body);
  if (words < 275) issues.push(`${control.chapter} must be at least 275 words; found ${words}.`);
  if (words > 435) issues.push(`${control.chapter} must be at most 435 words; found ${words}.`);
  if (genericChainPattern.test(body)) issues.push("The chapter expands direct rulership into a generic chain interpretation.");
  if (inventedBiographyPattern.test(body)) issues.push("The chapter invents biography or history.");
  if (categoricalBehaviorPattern.test(body)) issues.push("The chapter states categorical behavior.");
  if (otherPersonInnerStatePattern.test(body)) issues.push("The chapter claims another person's inner state.");
  if (unsupportedElsewhereEvidencePattern.test(body)) issues.push("The chapter invokes unselected evidence from elsewhere in the chart.");
  if (hasAffirmedClaim(body, currentActivationPattern)) issues.push("The chapter invents current timing or activation.");
  if (unnecessaryOrbPrecisionPattern.test(body)) issues.push("The chapter narrates unnecessary orb precision.");
  if (activeBlocker === "relationships-lunar-chain") {
    if (!moonAnchorPattern.test(body)) issues.push("The chapter omits the Moon in Pisces anchor.");
    if (!moonRulesSeventhPattern.test(body)) issues.push("The chapter omits that the Moon rules the seventh house.");
  } else {
    if (hasAffirmedClaim(body, privilegedPerceptionPattern)) issues.push("The chapter turns symbolic evidence into privileged or rapid social perception.");
    const rebuttalTerms = body.match(perceptionRebuttalTermPattern)?.length ?? 0;
    if (rebuttalTerms > 4) issues.push("The chapter circles the forbidden perception claim instead of developing a bounded Blind Spots mechanism.");
    if (!plutoAnchorPattern.test(body)) issues.push("The chapter omits the Pluto in Scorpio anchor.");
    if (!neptunePlutoSextilePattern.test(body)) issues.push("The chapter omits Neptune sextile Pluto.");
  }
  if (/\bChiron\b/i.test(body) && !bullets.some((bullet) => /\bChiron\b/i.test(`${bullet.label} ${bullet.meaning}`))) {
    issues.push("The chapter imports Chiron without selected evidence.");
  }
  return [...new Set(issues)];
}

function normalizeBody(value: string) {
  return value
    .trim()
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(new RegExp(`^#{1,6}\\s+${control.chapter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "im"), "")
    .trim();
}

function targetedOverreachPass(body: string, activeBlocker: BlockerKey) {
  return activeBlocker === "relationships-lunar-chain"
    ? !genericChainPattern.test(body)
    : !hasAffirmedClaim(body, privilegedPerceptionPattern) &&
      (body.match(perceptionRebuttalTermPattern)?.length ?? 0) <= 4;
}

function requiredAnchorsPass(body: string, activeBlocker: BlockerKey) {
  return activeBlocker === "relationships-lunar-chain"
    ? moonAnchorPattern.test(body) && moonRulesSeventhPattern.test(body)
    : plutoAnchorPattern.test(body) && neptunePlutoSextilePattern.test(body);
}

function hasAffirmedClaim(text: string, pattern: RegExp) {
  return text
    .split(/(?:[.!?;]|—|\bbut\b|\byet\b)+/i)
    .some((clause) => pattern.test(clause) && !explicitClaimNegationPattern.test(clause));
}

function constructiveRetryGuidance(issue: string) {
  if (/circles the forbidden perception claim/i.test(issue)) {
    return "Develop symbolic importance versus observable information directly. Keep groups as life-area context and avoid examples about evaluating them.";
  }
  if (/unselected evidence from elsewhere/i.test(issue)) {
    return "Use only the listed evidence. Do not refer to other placements, signals, factors, or parts of the chart.";
  }
  return issue;
}

function markdownSection(markdown: string, title: string) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return markdown.match(new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=^## |\\s*$)`, "m"))?.[1]?.trim() ?? "";
}

function wordCount(value: string) {
  return value.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu)?.length ?? 0;
}

async function writePrivate(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, content, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}

async function readAttempts(path: string): Promise<RecordedAttempt[]> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as RecordedAttempt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (recordFrom(error).code === "ENOENT") return [];
    throw error;
  }
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? clean(process.argv[index + 1]) : "";
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function recordFrom(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function usageCost(value: unknown) {
  const cost = recordFrom(value).cost;
  return typeof cost === "number" && Number.isFinite(cost) ? cost : 0;
}

function textFrom(value: unknown) {
  return typeof value === "string" ? value : "";
}
