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

const rulershipAsAspectPattern = /\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s+(?:is\s+)?disposed\s+by\s+(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s*,?\s+(?:which\s+is\s+)?(?:an?\s+)?(?:conjunction|opposition|square|trine|sextile|quincunx)\s+aspect\b/i;
const inventedBiographyPattern = /\b(?:you(?:'|’)ve likely lived through|you have likely lived through|you learned early|learned to compensate|growing up|in (?:your )?childhood|throughout your career|in past relationships|your early home life|a family pattern|old wound|defensive (?:reaction|pattern|strategy))\b/i;
const categoricalBehaviorPattern = /\b(?:you act before you think|you react before you think|you (?:always|usually|never) (?:know|sense|see|read|react|act|withdraw|overcommit)|you are (?:the kind|the type|someone) who|your instinct is to)\b/i;
const otherPersonInnerStatePattern = /\b(?:another person|someone else|the other person)(?:'s|’s)?\s+(?:motive|mood|need|fear|intention|reaction|response|inner life)\b/i;
const venusInFifthHousePattern = /\bVenus\s+(?:(?:is|sits|stands|falls|placed|located)\s+)(?!not\b)(?:in|within)\s+(?:your\s+|the\s+)?(?:5th|fifth)\s+house\b/i;
const genericDispositorChainPattern = /\bdispositor chains?\b|\bplanets?\s+(?:hand|pass)(?:s|ing)?\s+(?:off|along)\s+(?:their\s+)?(?:expression|influence|meaning)\b|\b(?:wider|broader|general)\s+(?:rulership|governance)\s+chains?\b/i;
const venusRulesFifthPattern = /\bVenus\s+rules\s+(?:your\s+|the\s+)?(?:5th|fifth)\s+house\b/i;
const plutoDisposedByMarsPattern = /\bPluto\s+(?:is\s+)?disposed\s+by\s+Mars\b/i;

const generationApproved = process.argv.includes("--generate");
const email = option("--email") || "astramaster@tony.io";
const model = option("--model") || reportModelProfileModels.production[0];
const packetDir = resolve(
  option("--packet") ||
    ".astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10"
);
const outputDir = join(packetDir, "blockers", "marissa-gifts-dispositor-chain");
const apiKey = clean(process.env.ASTRA_OPENROUTER_API_KEY) || clean(process.env.OPENROUTER_API_KEY);

if (!generationApproved) throw new Error("Use --generate to approve the single Marissa Gifts model call.");
if (!apiKey) throw new Error("ASTRA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is required.");
if (!reportModelProfileModels.production.includes(model as (typeof reportModelProfileModels.production)[number])) {
  throw new Error(`Use an approved production report model. Received: ${model}`);
}

await mkdir(outputDir, { recursive: true, mode: 0o700 });

try {
  const bundle = await exportPortableUserData(db, {
    email,
    sourceLabel: "semantic-synthesis-v2-phase-5-marissa-gifts-dispositor-control"
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
    intent: "Semantic Synthesis V2 Phase 5.1 targeted Marissa Gifts generic dispositor-chain control.",
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
  const giftsSelection = views?.deep.chapters.find((chapter) => chapter.title === "Gifts");
  const giftsEvidence = buildAstrologyReportSectionEvidence(request, headings)
    .find((chapter) => chapter.title === "Gifts");
  if (!giftsSelection || !giftsEvidence) throw new Error("Marissa Gifts selection or evidence was not built.");
  const primary = network.complexes.find((complex) => complex.id === giftsSelection.primaryComplexId);
  if (!primary) throw new Error("Marissa Gifts primary meaning complex was not found.");

  const mislabeledEvidence = giftsEvidence.evidenceBullets.filter((bullet) =>
    /\bdisposed by\b/i.test(`${bullet.label} ${bullet.meaning}`) &&
    /\baspect\b/i.test(bullet.meaning)
  );
  if (mislabeledEvidence.length) {
    throw new Error(`Selected evidence still labels a dispositor as an aspect: ${JSON.stringify(mislabeledEvidence)}`);
  }
  const houseRulerEvidence = giftsEvidence.evidenceBullets
    .find((bullet) => bullet.label === "House 5 ruler venus");
  const houseRulerEvidencePass = Boolean(
    houseRulerEvidence &&
    /\bVenus rules 5th house\b/.test(houseRulerEvidence.meaning) &&
    /\bVenus in 2nd house\b/.test(houseRulerEvidence.meaning) &&
    !/\bHouse 5 ruler venus in 5th house\b/.test(houseRulerEvidence.meaning)
  );
  if (!houseRulerEvidencePass) {
    throw new Error(`House-ruler evidence does not distinguish the ruled house from Venus's placement: ${JSON.stringify(houseRulerEvidence)}`);
  }
  const directDispositorEvidence = giftsEvidence.evidenceBullets
    .find((bullet) => bullet.label === "pluto disposed by mars");
  const directRulershipEvidencePass = Boolean(
    houseRulerEvidencePass &&
    directDispositorEvidence &&
    /\bpluto disposed by mars\b/i.test(directDispositorEvidence.meaning) &&
    /\brulership dispositor\b/i.test(directDispositorEvidence.meaning)
  );
  if (!directRulershipEvidencePass) {
    throw new Error(`Direct rulership evidence is incomplete: ${JSON.stringify({ houseRulerEvidence, directDispositorEvidence })}`);
  }
  const genericChainEvidence = giftsEvidence.evidenceBullets
    .filter((bullet) => /\bdispositor-chain\b/i.test(`${bullet.label} ${bullet.meaning}`));
  const genericChainEvidencePass = genericChainEvidence.length === 0;
  if (!genericChainEvidencePass) {
    throw new Error(`Generic dispositor-chain evidence remains writer-facing: ${JSON.stringify(genericChainEvidence)}`);
  }

  const evidencePacket = {
    subject: request.subjectName,
    chapter: "Gifts",
    primaryComplexId: giftsSelection.primaryComplexId,
    mechanism: primary.mechanism,
    hypothesis: primary.hypothesis,
    claimBoundary: primary.claimBoundary,
    interpretiveJob: giftsSelection.interpretiveJob,
    evidenceBullets: giftsEvidence.evidenceBullets
  };
  await writePrivate(join(outputDir, "selected-evidence.json"), `${JSON.stringify(evidencePacket, null, 2)}\n`);

  const attemptsPath = join(outputDir, "generation-attempts.json");
  const attempts = await readAttempts(attemptsPath);
  for (const attempt of attempts) {
    attempt.issues = validateChapter(attempt.body, giftsEvidence.evidenceBullets);
  }
  let previousIssues: string[] = attempts.at(-1)?.issues ?? [];
  let acceptedBody = "";
  let acceptedAttemptNumber: number | null = null;
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (!attempts[index]!.issues.length) {
      acceptedBody = attempts[index]!.body;
      acceptedAttemptNumber = attempts[index]!.attempt;
      break;
    }
  }
  const firstNewAttempt = attempts.length + 1;

  for (let attempt = firstNewAttempt; !acceptedBody && attempt < firstNewAttempt + 3; attempt += 1) {
    const response = await generateChapter(buildPrompt(evidencePacket, previousIssues));
    const body = normalizeBody(response.text);
    const issues = validateChapter(body, giftsEvidence.evidenceBullets);
    attempts.push({ attempt, body, issues, usage: response.usage });
    await writePrivate(attemptsPath, `${JSON.stringify(attempts, null, 2)}\n`);
    if (!issues.length) {
      acceptedBody = body;
      acceptedAttemptNumber = attempt;
      break;
    }
    previousIssues = issues;
  }
  await writePrivate(attemptsPath, `${JSON.stringify(attempts, null, 2)}\n`);

  const decision = acceptedBody ? "PASS" : "HOLD";
  const modelSpend = attempts.reduce((sum, attempt) => sum + usageCost(attempt.usage), 0);
  if (acceptedBody) {
    await writePrivate(
      join(outputDir, "marissa-gifts.md"),
      `# Marissa Yahil — Deep Gifts targeted control\n\n## Gifts\n\n${acceptedBody}\n`
    );
  }
  await writePrivate(
    join(outputDir, "decision.md"),
    [
      "# Marissa Gifts generic dispositor-chain narration blocker",
      "",
      `Decision: ${decision}`,
      "",
      `- Recorded generation attempts: ${attempts.length}`,
      `- Accepted recorded attempt: ${acceptedAttemptNumber ?? "none"}`,
      `- Known model spend: $${modelSpend.toFixed(6)}`,
      "- Scope: Gifts chapter only",
      "- Complete Deep reports generated: 0",
      "- Other subjects generated: 0",
      `- Exact direct rulership evidence retained: ${directRulershipEvidencePass ? "PASS" : "FAIL"}`,
      `- Generic dispositor-chain evidence omitted: ${genericChainEvidencePass ? "PASS" : "FAIL"}`,
      `- Exact direct rulership facts retained in prose: ${acceptedBody && venusRulesFifthPattern.test(acceptedBody) && plutoDisposedByMarsPattern.test(acceptedBody) ? "PASS" : "FAIL"}`,
      `- Generic dispositor-chain narration omitted: ${acceptedBody && !genericDispositorChainPattern.test(acceptedBody) ? "PASS" : "FAIL"}`,
      `- Unsupported biography: ${acceptedBody && !inventedBiographyPattern.test(acceptedBody) ? "PASS" : "FAIL"}`,
      `- Categorical behavior: ${acceptedBody && !categoricalBehaviorPattern.test(acceptedBody) ? "PASS" : "FAIL"}`,
      "",
      decision === "PASS"
        ? "The targeted chapter retained the exact direct rulership facts without expanding them into a generic dispositor-chain explanation."
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
    evidenceBullets: Array<{ label: string; meaning: string }>;
  },
  previousIssues: string[]
) {
  return [
    "Write only the body of one Astra Deep Gifts chapter in plain Markdown.",
    "Do not write a heading, report title, evidence block, JSON, or another chapter.",
    "Target 275-400 words.",
    `Subject: ${evidence.subject}. Address the reader as you.`,
    `Chapter job: ${evidence.interpretiveJob}.`,
    `Bounded hypothesis: ${evidence.hypothesis}`,
    `Claim boundary: ${evidence.claimBoundary}`,
    "Use only the selected evidence below. Personal descriptions must be measured possibilities, not facts about established behavior.",
    "Do not invent biography, history, routines, another person's inner state, or a proven skill.",
    "Keep house rulership separate from planetary placement: Venus rules the 5th house, while Venus itself is placed in the 2nd house.",
    "Never say or imply that Venus is in the 5th house.",
    "Use the exact direct rulership facts plainly: Venus rules the 5th house while remaining in the 2nd house, and Pluto is disposed by Mars.",
    "Do not use the phrase dispositor chain or explain a general chain, hand-off, system, or sequence of planetary governance.",
    "A direct dispositor is a rulership relationship, never an aspect. Do not call it a conjunction, opposition, square, trine, sextile, or quincunx.",
    "Explain the contribution in direct, plainspoken language.",
    "Selected evidence:",
    ...evidence.evidenceBullets.map((bullet) => `- ${bullet.label}: ${bullet.meaning}`),
    previousIssues.length ? "The previous attempt failed. Correct every issue:" : "",
    ...previousIssues.map((issue) => `- ${issue}`)
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
      temperature: 0.3,
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
  if (!text?.trim()) throw new Error("OpenRouter returned no Gifts prose.");
  return { text, usage: payload.usage ?? null };
}

function validateChapter(
  body: string,
  bullets: Array<{ label: string; meaning: string }>
) {
  const issues: string[] = [];
  const words = wordCount(body);
  if (words < 275) issues.push(`Gifts must be at least 275 words; found ${words}.`);
  if (words > 435) issues.push(`Gifts must be at most 435 words; found ${words}.`);
  if (rulershipAsAspectPattern.test(body)) issues.push("A rulership or dispositor relationship is labeled as an aspect.");
  if (inventedBiographyPattern.test(body)) issues.push("The chapter invents biography or history.");
  if (categoricalBehaviorPattern.test(body)) issues.push("The chapter states categorical behavior.");
  if (otherPersonInnerStatePattern.test(body)) issues.push("The chapter claims another person's inner state.");
  if (venusInFifthHousePattern.test(body)) issues.push("The ruled fifth house is presented as Venus's placement.");
  if (genericDispositorChainPattern.test(body)) issues.push("The chapter expands direct rulership into a generic dispositor-chain explanation.");
  if (!venusRulesFifthPattern.test(body)) issues.push("The chapter omits the direct fact that Venus rules the fifth house.");
  if (!plutoDisposedByMarsPattern.test(body)) issues.push("The chapter omits the direct fact that Pluto is disposed by Mars.");
  if (!/\bVenus\b/i.test(body)) issues.push("The chapter does not use its Venus anchor.");

  const selected = bullets.map((bullet) => `${bullet.label} ${bullet.meaning}`).join("\n");
  const allowedAspects = new Set(
    [...selected.matchAll(/\b(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s+(conjunction|opposition|square|trine|sextile|quincunx)\s+(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\b/gi)]
      .map((match) => aspectKey(match[1]!, match[2]!, match[3]!))
  );
  for (const match of body.matchAll(/\b(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\s+(?:is\s+)?(conjunct|conjunction|opposes|opposition|squares|square|trines|trine|sextiles|sextile|quincunxes|quincunx)\s+(?:to\s+|with\s+)?(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron)\b/gi)) {
    const key = aspectKey(match[1]!, normalizeAspect(match[2]!), match[3]!);
    if (!allowedAspects.has(key)) issues.push(`Unsupported aspect claim: ${match[0]}.`);
  }
  return [...new Set(issues)];
}

function normalizeAspect(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "conjunct") return "conjunction";
  if (normalized === "opposes") return "opposition";
  if (normalized === "squares") return "square";
  if (normalized === "trines") return "trine";
  if (normalized === "sextiles") return "sextile";
  if (normalized === "quincunxes") return "quincunx";
  return normalized;
}

function aspectKey(left: string, aspect: string, right: string) {
  return `${[left.toLowerCase(), right.toLowerCase()].sort().join(":")}:${aspect.toLowerCase()}`;
}

function normalizeBody(value: string) {
  return value
    .trim()
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/^#{1,6}\s+Gifts\s*$/im, "")
    .trim();
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

async function readAttempts(path: string) {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as Array<{
      attempt: number;
      body: string;
      issues: string[];
      usage: unknown;
    }>;
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
