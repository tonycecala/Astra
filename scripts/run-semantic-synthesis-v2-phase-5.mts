import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_OPENROUTER_API_KEY_ENV,
  ASTRA_REPORT_MODEL_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_MODEL_PROVIDER_ENV,
  ASTRA_REPORT_PROMPT_VERSION,
  ASTRA_REPORT_WRITER_ENV,
  ASTRA_SEMANTIC_SYNTHESIS_VERSION,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  OPENROUTER_DEFAULT_BASE_URL,
  OPENROUTER_REPORT_MODEL_PROVIDER,
  buildAstrologyMeaningComplexNetwork,
  buildAstrologyMeaningComplexReportViews,
  buildAstrologyReportResultAsync,
  buildAstrologyReportSectionEvidence,
  measureReportReadability,
  reportModelProfileModels,
  type MeaningComplex,
  type MeaningComplexNetwork,
  type MeaningComplexReportView
} from "@astra/astrology";
import {
  astrologyReportRequestSchema,
  hasResolvedBirthCoordinates,
  type AstrologyReportRequest,
  type RecordAstrologyReportResult
} from "@astra/contracts";
import { closeDatabaseConnection, db, exportPortableUserData } from "@astra/db";

import {
  PHASE_5_EVALUATION_VERSION,
  assertSignsOnlyEvidenceHasNoLeakage,
  completeSemanticPair,
  evaluateReportDeterministically,
  evaluateSemanticGate,
  phase5SemanticCategories,
  sha256,
  validateRepetitionEvaluation,
  validateSemanticEvaluation,
  type Phase5RepetitionEvaluation,
  type Phase5SemanticEvaluation
} from "./lib/semantic-synthesis-v2-evaluation";

type JsonObject = Record<string, unknown>;
type Family = "identity" | "core" | "deep";
type PortableBundle = Awaited<ReturnType<typeof exportPortableUserData>>;
type SourceChart = ReturnType<typeof sourceChartFor>;
type ReportResult = RecordAstrologyReportResult;
type GeneratedControl = {
  subject: string;
  family: "core" | "deep";
  result: ReportResult;
  baseline: ReportResult;
  evidence: ReturnType<typeof evidencePacket>;
  deterministic: ReturnType<typeof evaluateReportDeterministically>;
  comparison: ReturnType<typeof compareReports>;
};

const generationApproved = process.argv.includes("--generate");
const resume = process.argv.includes("--resume");
const evaluationOnly = process.argv.includes("--evaluate-only");
const email = option("--email") || "astramaster@tony.io";
const reportSubjects = csvOption("--subjects", "Felicia Weiss,Cheyenne Autumn,Marissa Yahil");
const deepOnlySubjects = csvOption("--deep-only-subjects", "");
const structuralSubjects = csvOption("--structural-controls", "Brandi McCulley,Rachel Ijames");
const practicalGo = process.argv.includes("--practical-go");
const maximumGenerationAttempts = integerOption("--max-generation-attempts", 3);
const model = option("--model") || reportModelProfileModels.production[0];
const evaluatorModel = option("--evaluator-model") || "openai/gpt-5.6-terra";
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = resolve(option("--output") || `.astra-exports/semantic-synthesis-v2-phase-5/${runStamp}`);
const resumeFromDir = resolve(option("--resume-from") || outputDir);
const baselineDir = resolve(option("--baseline") || ".astra-exports/semantic-synthesis/2026-07-26T21-56-13-610Z-ally-control");
const tonyV2ReportId = option("--tony-report") || "d9c6c4d2-f8d7-4a0f-9dba-eedc28be8044";
const tonyV1ReportId = option("--tony-v1-report") || "2efc0045-d902-4303-b881-bccd684ae76a";
const apiKey = clean(process.env[ASTRA_OPENROUTER_API_KEY_ENV]) || clean(process.env.OPENROUTER_API_KEY);
const sourceRevision = git(["rev-parse", "HEAD"]);
const sourceBranch = git(["branch", "--show-current"]);
const generationFailures: Array<{ label: string; attempt: number; error: string }> = [];
const subjectSetupFailures: Array<{ subject: string; error: string }> = [];
let evaluatorSpend = 0;
let evaluatorInputTokens = 0;
let evaluatorOutputTokens = 0;

if (process.argv.includes("--help")) {
  console.log("Run the private Semantic Synthesis V2 Phase 5 evaluation packet.");
  console.log("Required: --generate. Tony's existing control is reused; no Tony report is generated.");
  console.log("Optional: --resume, --resume-from, --evaluate-only, --email, --subjects, --deep-only-subjects, --structural-controls, --model, --evaluator-model, --baseline, --output, --max-generation-attempts, --practical-go.");
  process.exit(0);
}
if (!generationApproved) throw new Error("Use --generate to approve non-Tony report and independent evaluator calls.");
if (maximumGenerationAttempts < 1 || maximumGenerationAttempts > 3) {
  throw new Error("--max-generation-attempts must be between 1 and 3.");
}
if (!apiKey) throw new Error(`${ASTRA_OPENROUTER_API_KEY_ENV} or OPENROUTER_API_KEY is required.`);
if (!reportModelProfileModels.production.includes(model as (typeof reportModelProfileModels.production)[number])) {
  throw new Error(`Use an approved production report model. Received: ${model}`);
}
if (!reportModelProfileModels.premium_bakeoff.includes(evaluatorModel as (typeof reportModelProfileModels.premium_bakeoff)[number])) {
  throw new Error(`Use an approved independent evaluator model. Received: ${evaluatorModel}`);
}
if (reportSubjects.some((subject) => /^tony\b/i.test(subject))) {
  throw new Error("Tony cannot appear in --subjects. Phase 5 must reuse the existing Tony control.");
}
if (deepOnlySubjects.length && !resume) {
  throw new Error("--deep-only-subjects requires --resume with a complete prior Phase 5 packet.");
}
if (evaluationOnly && !resume) throw new Error("--evaluate-only requires --resume.");
if (deepOnlySubjects.some((subject) => !reportSubjects.includes(subject))) {
  throw new Error("--deep-only-subjects must be a subset of --subjects.");
}
if (deepOnlySubjects.some((subject) => /^tony\b/i.test(subject))) {
  throw new Error("Tony cannot appear in --deep-only-subjects.");
}

await createDirectories();
if (resume) {
  generationFailures.push(...await readRetainedGenerationFailures());
}

try {
  const bundle = await exportPortableUserData(db, { email, sourceLabel: "semantic-synthesis-v2-phase-5" });
  const tonySource = sourceChartFor(bundle, "Tony Cecala", "self");
  const reportSources = reportSubjects.map((subject) => sourceChartFor(bundle, subject, "ally"));
  const structuralSources = structuralSubjects.map((subject) => sourceChartFor(bundle, subject, "ally"));

  const trustedControls = [tonySource, ...reportSources, ...structuralSources].map((source) =>
    trustedControlMatrix(source)
  );
  const tonyFingerprint = trustedControls.find((control) => control.subject === tonySource.subjectName)?.primaryFingerprint;
  if (!tonyFingerprint) throw new Error("Tony trusted-chart fingerprint is missing.");
  for (const subject of structuralSubjects) {
    const control = trustedControls.find((candidate) => candidate.subject === subject);
    if (!control || control.primaryFingerprint === tonyFingerprint) {
      throw new Error(`${subject} does not provide a structure fingerprint distinct from Tony.`);
    }
  }
  if (new Set(structuralSubjects.map((subject) =>
    trustedControls.find((candidate) => candidate.subject === subject)?.primaryFingerprint
  )).size !== structuralSubjects.length) {
    throw new Error("Structural controls must differ from each other, not only from Tony.");
  }

  const generated: GeneratedControl[] = [];
  for (const source of reportSources) {
    let canonicalIdentity = "";
    if (resume) {
      const savedCore = await trySavedV2Report(source.subjectName, "core");
      const savedDeep = savedCore ? null : await trySavedV2Report(source.subjectName, "deep");
      canonicalIdentity = savedCore
        ? sectionBody(savedCore, "Identity")
        : savedDeep
          ? sectionBody(savedDeep, "Identity")
          : "";
      if (canonicalIdentity) {
        console.error(`${source.subjectName}/identity: reused from saved Phase 5 ${savedCore ? "Core" : "Deep"}`);
      }
    } else {
      console.error(`${source.subjectName}/identity: generating canonical Identity`);
      const identityResult = await generate(source, "identity", "", `${source.subjectName}/identity`);
      if (identityResult.status !== "completed") {
        subjectSetupFailures.push({
          subject: source.subjectName,
          error: identityResult.error || "canonical Identity generation failed"
        });
        console.error(`${source.subjectName}: skipped because canonical Identity did not complete`);
        continue;
      }
      canonicalIdentity = sectionBody(identityResult, "Identity");
    }
    if (!canonicalIdentity) throw new Error(`${source.subjectName} canonical Identity was empty.`);
    const canonicalIdentityHash = sha256(canonicalIdentity);

    for (const family of ["core", "deep"] as const) {
      const forceRegeneration = !evaluationOnly && family === "deep" && deepOnlySubjects.includes(source.subjectName);
      const saved = resume && !forceRegeneration
        ? await trySavedV2Report(source.subjectName, family)
        : null;
      const expectedSectionCount = family === "core" ? 4 : 9;
      const reusable = saved?.sections.length === expectedSectionCount ? saved : null;
      if (evaluationOnly && !reusable) {
        subjectSetupFailures.push({
          subject: `${source.subjectName}/${family}`,
          error: "No completed saved report was available for evaluation-only resume."
        });
        console.error(`${source.subjectName}/${family}: unavailable; evaluation-only mode will not regenerate it`);
        continue;
      }
      console.error(`${source.subjectName}/${family}: ${reusable ? "reusing saved V2" : forceRegeneration ? "regenerating V2 Deep" : "generating V2"}`);
      const request = requestFor(source, family, canonicalIdentity, {
        zodiacMode: source.chartSettings.zodiacMode,
        houseSystem: source.chartSettings.houseSystem,
        calculationMode: "full"
      });
      const result = reusable ??
        await generateRequestWithRetries(request, `${source.subjectName}/${family}`, maximumGenerationAttempts);
      const baseline = await baselineReport(source.subjectName, family);
      const evidence = evidencePacket(request, family);
      const deterministic = evaluateReportDeterministically(result, {
        key: `${slug(source.subjectName)}/${family}`,
        family,
        canonicalIdentityHash,
        contextIsUnspecified: true
      });
      const comparison = compareReports(baseline, result);
      generated.push({ subject: source.subjectName, family, result, baseline, evidence, deterministic, comparison });

      if (!reusable) {
        await writePrivate(join(outputDir, "reports", `${slug(source.subjectName)}-${family}-v1.md`), reportMarkdown(source.subjectName, family, baseline, "V1 control"));
        await writePrivate(join(outputDir, "reports", `${slug(source.subjectName)}-${family}-v2.md`), reportMarkdown(source.subjectName, family, result, "V2 Phase 5 control"));
      } else if (resumeFromDir !== outputDir) {
        await writePrivate(join(outputDir, "reports", `${slug(source.subjectName)}-${family}-v1.md`), reportMarkdown(source.subjectName, family, baseline, "V1 control"));
        await writePrivate(join(outputDir, "reports", `${slug(source.subjectName)}-${family}-v2.md`), reportMarkdown(source.subjectName, family, result, "reused V2 control"));
      }
      await writeJson(join(outputDir, "evidence", `${slug(source.subjectName)}-${family}.json`), evidence);
      console.error(`${source.subjectName}/${family}: ${result.status}; ${comparison.after.words} words; ${deterministic.hardGateIssues.length} deterministic issues`);
    }
  }

  const tonyResult = completedReportFromBundle(bundle, tonyV2ReportId);
  const tonyBaseline = completedReportFromBundle(bundle, tonyV1ReportId);
  const tonyRequest = requestFor(tonySource, "deep", sectionBody(tonyResult, "Identity"), {
    zodiacMode: tonySource.chartSettings.zodiacMode,
    houseSystem: tonySource.chartSettings.houseSystem,
    calculationMode: "full"
  });
  const tonyEvidence = evidencePacket(tonyRequest, "deep");
  const tonyDeterministic = evaluateReportDeterministically(tonyResult, {
    key: "tony/deep",
    family: "deep",
    canonicalIdentityHash: sha256(sectionBody(tonyResult, "Identity")),
    contextIsUnspecified: true,
    historicalControl: true
  });
  const tonyComparison = compareReports(tonyBaseline, tonyResult);
  await writePrivate(join(outputDir, "reports", "tony-deep-v1.md"), reportMarkdown("Tony Cecala", "deep", tonyBaseline, "V1 recovered control"));
  await writePrivate(join(outputDir, "reports", "tony-deep-v2.md"), reportMarkdown("Tony Cecala", "deep", tonyResult, "existing Phase 4 control; not regenerated"));
  await writeJson(join(outputDir, "evidence", "tony-deep.json"), tonyEvidence);

  const semanticEvaluations: Phase5SemanticEvaluation[] = [];
  const semanticCandidateControls: GeneratedControl[] = [];
  for (const subject of reportSubjects) {
    const pair = completeSemanticPair(generated, subject);
    if (!pair.length) continue;
    semanticCandidateControls.push(...pair);
    semanticEvaluations.push(...await evaluatePairSemantically(pair));
  }
  semanticEvaluations.push(...await evaluateTonySemantically(tonyResult, tonyBaseline, tonyEvidence));

  const repetitionEvaluations: Phase5RepetitionEvaluation[] = [];
  for (const control of generated.filter((candidate) =>
    candidate.family === "deep" && candidate.result.status === "completed"
  )) {
    repetitionEvaluations.push(await evaluateRepetition(control));
  }
  repetitionEvaluations.push(await evaluateRepetition({
    subject: "Tony",
    family: "deep",
    result: tonyResult,
    baseline: tonyBaseline,
    evidence: tonyEvidence,
    deterministic: tonyDeterministic,
    comparison: tonyComparison
  }));

  const expectedSemanticKeys = [
    ...semanticCandidateControls.map((control) => `${slug(control.subject)}/${control.family}`),
    "tony/deep"
  ];
  const semanticErrors = validateSemanticEvaluation(expectedSemanticKeys, semanticEvaluations);
  const repetitionErrors = validateRepetitionEvaluation(
    [
      ...generated.filter((control) => control.family === "deep" && control.result.status === "completed")
        .map((control) => `${slug(control.subject)}/deep`),
      "tony/deep"
    ],
    repetitionEvaluations
  );
  if (semanticErrors.length || repetitionErrors.length) {
    throw new Error(`Evaluator coverage failed: ${[...semanticErrors, ...repetitionErrors].join("; ")}`);
  }

  const gateSemanticEvaluations = practicalGo
    ? semanticEvaluations.filter((evaluation) => evaluation.key.endsWith("/deep"))
    : semanticEvaluations;
  const gateRepetitionEvaluations = practicalGo
    ? repetitionEvaluations.filter((evaluation) => evaluation.key.endsWith("/deep"))
    : repetitionEvaluations;
  const semanticGate = evaluateSemanticGate(gateSemanticEvaluations, gateRepetitionEvaluations, practicalGo
    ? {
        historicalKeys: ["tony/deep"],
        semanticAverageMinimum: 2.4,
        contextSafetyAverageMinimum: null,
        minimumCategories: ["astrological_correctness", "context_safety"],
        repetitionScoreMinimum: 2
      }
    : { historicalKeys: ["tony/deep"] });
  const deterministicIssues = [
    ...subjectSetupFailures.map((failure) => `${failure.subject}/identity: ${failure.error}`),
    ...generated.flatMap((control) => control.deterministic.hardGateIssues.map((issue) => `${slug(control.subject)}/${control.family}: ${issue}`)),
    ...tonyDeterministic.hardGateIssues.map((issue) => `tony/deep: ${issue}`)
  ];
  const calculationIssues = trustedControls.flatMap((control) => control.issues.map((issue) => `${control.subject}: ${issue}`));
  const hardGatePass = deterministicIssues.length === 0 && calculationIssues.length === 0;
  const reportGenerationCosts = generated
    .filter((control) => control.family === "deep" && deepOnlySubjects.includes(control.subject))
    .map((control) => ({
      subject: control.subject,
      status: control.result.status,
      attempts: control.result.generationMetadata?.attemptCount ?? 0,
      inputTokens: control.result.generationMetadata?.inputTokens ?? 0,
      outputTokens: control.result.generationMetadata?.outputTokens ?? 0,
      estimatedSpend: control.result.generationMetadata?.estimatedSpend ?? 0
    }));
  const reportGenerationSpend = reportGenerationCosts.reduce((sum, entry) => sum + entry.estimatedSpend, 0);

  const machineDecision = hardGatePass && semanticGate.pass ? "GO_CANDIDATE" : "HOLD";
  const manifest = {
    generatedAt: new Date().toISOString(),
    privateEvaluation: true,
    sourceBranch,
    sourceRevision,
    phase5EvaluationVersion: PHASE_5_EVALUATION_VERSION,
    semanticSynthesisVersion: ASTRA_SEMANTIC_SYNTHESIS_VERSION,
    promptVersion: ASTRA_REPORT_PROMPT_VERSION,
    model,
    evaluatorModel,
    reportSubjects,
    deepOnlySubjects,
    structuralSubjects,
    trustedChartSubjects: [tonySource.subjectName, ...reportSubjects, ...structuralSubjects],
    generatedReportCount: generated.length,
    completedGeneratedReportCount: generated.filter((control) => control.result.status === "completed").length,
    retainedGenerationFailures: generationFailures,
    subjectSetupFailures,
    tonyReportsGenerated: 0,
    tonyControl: { v1ReportId: tonyV1ReportId, v2ReportId: tonyV2ReportId },
    baselineDir,
    resumeFromDir,
    evaluationOnly,
    practicalGo,
    maximumGenerationAttempts,
    thresholds: semanticGate.thresholds,
    costs: {
      reportGeneration: reportGenerationCosts,
      reportGenerationSpend,
      evaluator: {
        inputTokens: evaluatorInputTokens,
        outputTokens: evaluatorOutputTokens,
        estimatedSpend: evaluatorSpend
      },
      totalEstimatedSpend: reportGenerationSpend + evaluatorSpend
    },
    hardGatePass,
    semanticGate,
    machineDecision,
    humanDecision: "pending"
  };

  await writeJson(join(outputDir, "trusted-chart-controls.json"), trustedControls);
  await writeJson(join(outputDir, "deterministic-results.json"), {
    hardGatePass,
    deterministicIssues,
    calculationIssues,
    reports: [...generated.map((control) => control.deterministic), tonyDeterministic]
  });
  await writeJson(join(outputDir, "evaluator", "semantic-results.json"), semanticEvaluations);
  await writeJson(join(outputDir, "evaluator", "repetition-results.json"), repetitionEvaluations);
  await writePrivate(join(outputDir, "evaluator", "evaluation.md"), evaluatorMarkdown(semanticEvaluations, repetitionEvaluations, semanticGate));
  await writePrivate(join(outputDir, "human-review.md"), humanReviewWorksheet(generated, {
    result: tonyResult,
    baseline: tonyBaseline,
    evidence: tonyEvidence,
    deterministic: tonyDeterministic,
    comparison: tonyComparison
  }));
  await writePrivate(join(outputDir, "decision.md"), decisionWorksheet(manifest, deterministicIssues, calculationIssues));
  await writeJson(join(outputDir, "manifest.json"), manifest);

  console.log(JSON.stringify({
    ok: hardGatePass && semanticGate.pass,
    outputDir,
    hardGatePass,
    semanticGate,
    machineDecision,
    attemptedReports: generated.length,
    completedReports: generated.filter((control) => control.result.status === "completed").length,
    tonyReportsGenerated: 0
  }, null, 2));
} catch (error) {
  await writeJson(join(outputDir, "fatal-error.json"), {
    message: error instanceof Error ? error.message : String(error),
    reportSubjects,
    deepOnlySubjects,
    tonyReportsGenerated: 0
  });
  throw error;
} finally {
  await closeDatabaseConnection();
}

function sourceChartFor(bundle: PortableBundle, subjectName: string, source: "self" | "ally") {
  const chart = [...bundle.data.chartRequests]
    .filter((candidate) => candidate.subjectName === subjectName && candidate.source === source && candidate.status === "completed")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  if (!chart) throw new Error(`No completed saved ${source} chart was found for ${subjectName}.`);
  if (!hasResolvedBirthCoordinates(chart.birthData)) throw new Error(`${subjectName} does not have resolved birth coordinates.`);
  const settings = recordFrom(recordFrom(chart.context).chartSettings);
  const zodiacMode = textFrom(settings.zodiacMode) || "tropical";
  const houseSystem = textFrom(settings.houseSystem) || "whole-sign";
  if (!new Set(["tropical", "sidereal"]).has(zodiacMode)) throw new Error(`${subjectName} has invalid Zodiac settings.`);
  if (!new Set(["whole-sign", "placidus"]).has(houseSystem)) throw new Error(`${subjectName} has invalid house settings.`);
  return {
    chartRequestId: chart.id,
    userId: chart.userId,
    subjectName,
    source,
    birthData: chart.birthData,
    chartSettings: {
      zodiacMode: zodiacMode as "tropical" | "sidereal",
      houseSystem: houseSystem as "whole-sign" | "placidus"
    }
  };
}

function requestFor(
  source: SourceChart,
  family: Family,
  canonicalIdentity: string,
  settings: {
    zodiacMode: "tropical" | "sidereal";
    houseSystem: "whole-sign" | "placidus";
    calculationMode: "full" | "signs-aspects-only";
  }
) {
  const birthData = settings.calculationMode === "full"
    ? source.birthData
    : {
        date: source.birthData.date,
        time: source.birthData.time,
        birthTimeKnown: source.birthData.birthTimeKnown,
        timezone: source.birthData.timezone
      };
  const now = new Date().toISOString();
  return astrologyReportRequestSchema.parse({
    id: randomUUID(),
    userId: source.userId,
    chartRequestId: source.chartRequestId,
    reportType: family,
    subjectName: source.subjectName,
    birthData,
    question: "What does this natal chart show when each life area is synthesized from its strongest evidence?",
    intent: "Semantic Synthesis V2 Phase 5 private evaluation control.",
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
      ...(family === "identity" ? {} : { canonicalIdentity })
    },
    source: source.source,
    boundary: "private",
    status: "queued",
    costCredits: family === "identity" ? 1 : family === "core" ? 5 : 10,
    reportBasis: {
      schemaVersion: 2,
      type: "natal",
      chartSettings: {
        zodiacMode: settings.zodiacMode,
        houseSystem: settings.houseSystem
      },
      primary: {
        chartRequestId: source.chartRequestId,
        subjectType: source.source,
        subjectId: source.source === "self" ? source.userId : source.chartRequestId,
        subjectName: source.subjectName,
        birthData,
        calculationMode: settings.calculationMode
      }
    },
    createdAt: now,
    updatedAt: now
  });
}

async function generate(source: SourceChart, family: Family, canonicalIdentity: string, label: string) {
  return generateRequestWithRetries(requestFor(source, family, canonicalIdentity, {
    zodiacMode: source.chartSettings.zodiacMode,
    houseSystem: source.chartSettings.houseSystem,
    calculationMode: "full"
  }), label);
}

async function generateRequest(request: AstrologyReportRequest) {
  return buildAstrologyReportResultAsync(request, {
    env: {
      [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
      [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
      [ASTRA_REPORT_MODEL_PROVIDER_ENV]: OPENROUTER_REPORT_MODEL_PROVIDER,
      [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
      [ASTRA_REPORT_MODEL_ENV]: model,
      [ASTRA_OPENROUTER_API_KEY_ENV]: apiKey
    },
    fetchImpl: fetch
  });
}

async function generateRequestWithRetries(request: AstrologyReportRequest, label: string, maximumAttempts = 3) {
  let result = await generateRequest(request);
  for (let attempt = 1; result.status !== "completed" && attempt < maximumAttempts; attempt += 1) {
    generationFailures.push({
      label,
      attempt,
      error: result.error || "unknown error"
    });
    await writeJson(join(outputDir, "generation-failures.json"), generationFailures);
    console.error(`${label}: orchestration attempt ${attempt} rejected; retrying without changing gates`);
    result = await generateRequest(request);
  }
  if (result.status !== "completed") {
    generationFailures.push({
      label,
      attempt: maximumAttempts,
      error: result.error || "unknown error"
    });
    await writeJson(join(outputDir, "generation-failures.json"), generationFailures);
  }
  return result;
}

function trustedControlMatrix(source: SourceChart) {
  const variants = [
    { key: "tropical-whole-full", zodiacMode: "tropical", houseSystem: "whole-sign", calculationMode: "full" },
    { key: "tropical-placidus-full", zodiacMode: "tropical", houseSystem: "placidus", calculationMode: "full" },
    { key: "sidereal-whole-full", zodiacMode: "sidereal", houseSystem: "whole-sign", calculationMode: "full" },
    { key: "sidereal-placidus-full", zodiacMode: "sidereal", houseSystem: "placidus", calculationMode: "full" },
    { key: "tropical-whole-signs-only", zodiacMode: "tropical", houseSystem: "whole-sign", calculationMode: "signs-aspects-only" }
  ] as const;
  const issues: string[] = [];
  const results = variants.map((variant) => {
    const request = requestFor(source, "deep", "", variant);
    const network = buildAstrologyMeaningComplexNetwork(request);
    const views = buildAstrologyMeaningComplexReportViews(request);
    const evidence = buildAstrologyReportSectionEvidence(request, [
      "Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Integration"
    ]);
    if (!views) issues.push(`${variant.key}: no report views`);
    if (variant.calculationMode === "signs-aspects-only" && !assertSignsOnlyEvidenceHasNoLeakage(evidence)) {
      issues.push(`${variant.key}: reduced-mode leakage`);
    }
    if (network.complexes.some((complex) => !complex.provenance.sourceFactIds.length)) {
      issues.push(`${variant.key}: complex provenance gap`);
    }
    if (network.complexes.some((complex) =>
      complex.confidence === "strong" && complex.independentSupportCount < 2
    )) {
      issues.push(`${variant.key}: strong complex without independent support`);
    }
    return {
      key: variant.key,
      calculationMode: variant.calculationMode,
      complexCount: network.complexes.length,
      strongComplexCount: network.complexes.filter((complex) => complex.confidence === "strong").length,
      configurationLabels: network.nodes.filter((node) => node.type === "Configuration").map((node) => node.label).sort(),
      distributionLabels: network.nodes.filter((node) => node.type === "Distribution").map((node) => node.label).sort(),
      selectedDeepComplexIds: views?.deep.selectedComplexIds ?? [],
      fingerprint: structureFingerprint(network)
    };
  });
  return {
    subject: source.subjectName,
    role: structuralSubjects.includes(source.subjectName) ? "structural-control" : "report-control",
    primaryFingerprint: results[0]!.fingerprint,
    results,
    issues
  };
}

function structureFingerprint(network: MeaningComplexNetwork) {
  return JSON.stringify({
    configurations: network.nodes.filter((node) => node.type === "Configuration").map((node) => node.label).sort(),
    distributions: network.nodes.filter((node) => node.type === "Distribution").map((node) => node.label).sort(),
    mechanisms: [...new Set(network.complexes.map((complex) => complex.mechanism))].sort()
  });
}

function evidencePacket(request: AstrologyReportRequest, family: "core" | "deep") {
  const network = buildAstrologyMeaningComplexNetwork(request);
  const views = buildAstrologyMeaningComplexReportViews(request);
  if (!views) throw new Error(`${request.subjectName}/${family} produced no meaning-complex views.`);
  const view = views[family];
  const chapterEvidence = buildAstrologyReportSectionEvidence(
    request,
    family === "core"
      ? ["Identity", "Relationships", "Work", "Integration"]
      : ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Integration"]
  );
  const selectedIds = new Set([...view.canonicalIdentityComplexIds, ...view.selectedComplexIds]);
  const selectedComplexes = [...selectedIds].map((id) => {
    const complex = network.complexes.find((candidate) => candidate.id === id);
    if (!complex) throw new Error(`Selected complex ${id} is absent from the network.`);
    return complexPacket(complex, network, view);
  });
  const omittedCandidates = network.complexes
    .filter((complex) => !selectedIds.has(complex.id))
    .sort((left, right) => right.score.total - left.score.total || left.id.localeCompare(right.id))
    .slice(0, 8)
    .map((complex) => ({
      id: complex.id,
      mechanism: complex.mechanism,
      hypothesis: complex.hypothesis,
      score: complex.score.total,
      confidence: complex.confidence,
      reason: family === "core"
        ? "Outside the three-complex Core budget or already represented by a stronger domain owner."
        : "Outside the seven-complex Deep budget or already represented by a stronger chapter owner."
    }));
  return {
    subject: request.subjectName,
    family,
    rulesetVersion: views.rulesetVersion,
    networkRulesetVersion: views.networkRulesetVersion,
    calculationMode: network.calculationMode,
    canonicalIdentityComplexIds: view.canonicalIdentityComplexIds,
    selectedComplexIds: view.selectedComplexIds,
    chapters: view.chapters,
    chapterEvidence,
    selectedComplexes,
    omittedCandidates,
    networkAudit: network.audit
  };
}

function evaluatorEvidencePacket(packet: ReturnType<typeof evidencePacket>) {
  return {
    subject: packet.subject,
    family: packet.family,
    calculationMode: packet.calculationMode,
    canonicalIdentityComplexIds: packet.canonicalIdentityComplexIds,
    selectedComplexIds: packet.selectedComplexIds,
    chapters: packet.chapters,
    chapterEvidence: packet.chapterEvidence,
    selectedComplexes: packet.selectedComplexes.map((complex) => ({
      id: complex.id,
      mechanism: complex.mechanism,
      hypothesis: complex.hypothesis,
      domains: complex.domains,
      score: complex.score.total,
      confidence: complex.confidence,
      independentSupportCount: complex.independentSupportCount,
      supportPaths: complex.supportPaths.map((path) => ({
        mechanism: path.mechanism,
        nodeLabels: path.nodeLabels,
        independentOriginCount: path.independentOriginIds.length
      })),
      counterevidence: complex.counterevidence.map((path) => ({
        mechanism: path.mechanism,
        nodeLabels: path.nodeLabels
      })),
      qualifiers: complex.qualifiers,
      claimBoundary: complex.claimBoundary,
      chapterJobs: complex.chapterJobs
    })),
    omittedCandidates: packet.omittedCandidates
  };
}

function complexPacket(complex: MeaningComplex, network: MeaningComplexNetwork, view: MeaningComplexReportView) {
  const labels = new Map(network.nodes.map((node) => [node.id, node.label]));
  const path = (candidate: MeaningComplex["supportPaths"][number]) => ({
    id: candidate.id,
    role: candidate.role,
    mechanism: candidate.mechanism,
    nodeLabels: candidate.nodeIds.map((id) => labels.get(id) ?? id),
    sourceFactIds: candidate.sourceFactIds,
    independentOriginIds: candidate.independentOriginIds,
    derivationDistance: candidate.derivationDistance,
    pathScore: candidate.pathScore,
    provenance: candidate.provenance
  });
  return {
    id: complex.id,
    mechanism: complex.mechanism,
    hypothesis: complex.hypothesis,
    domains: complex.domains,
    score: complex.score,
    confidence: complex.confidence,
    confidenceReasons: complex.confidenceReasons,
    confidenceReductionReasons: complex.confidenceReductionReasons,
    independentSupportCount: complex.independentSupportCount,
    supportPaths: complex.supportPaths.map(path),
    counterevidence: complex.counterevidence.map(path),
    qualifiers: complex.qualifiers,
    claimBoundary: complex.claimBoundary,
    preferredView: complex.preferredView,
    chapterJobs: view.chapters.filter((chapter) =>
      chapter.primaryComplexId === complex.id || chapter.supportingComplexIds.includes(complex.id)
    ),
    provenance: complex.provenance
  };
}

async function baselineReport(subject: string, family: "core" | "deep") {
  const content = await readFile(join(baselineDir, "reports", `${slug(subject)}-${family}.md`), "utf8");
  return markdownReport(`${slug(subject)}-${family}-v1`, content);
}

async function savedV2Report(subject: string, family: "core" | "deep") {
  const content = await readFile(join(resumeFromDir, "reports", `${slug(subject)}-${family}-v2.md`), "utf8");
  return markdownReport(`${slug(subject)}-${family}-v2-resume`, content);
}

async function trySavedV2Report(subject: string, family: "core" | "deep") {
  try {
    return await savedV2Report(subject, family);
  } catch {
    return null;
  }
}

function completedReportFromBundle(bundle: PortableBundle, requestId: string): ReportResult {
  const result = bundle.data.reportResults.find((candidate) => candidate.requestId === requestId);
  if (!result || result.status !== "completed") throw new Error(`Completed report ${requestId} is not available.`);
  return result;
}

function markdownReport(requestId: string, content: string): ReportResult {
  const sections = content
    .split(/^## /m)
    .slice(1)
    .map((block, index) => {
      const newline = block.indexOf("\n");
      if (newline < 0) throw new Error(`${requestId} section ${index + 1} has no body.`);
      return {
        id: `${requestId}-${index}`,
        title: block.slice(0, newline).trim(),
        body: block.slice(newline + 1).trim(),
        emphasis: index === 0 ? "primary" as const : "supporting" as const
      };
    });
  if (!sections.length) throw new Error(`${requestId} baseline has no Markdown sections.`);
  return {
    requestId,
    userId: "phase5-private-baseline",
    engine: "astra-semantic-synthesis-v1-control",
    engineVersion: "1.0.0",
    status: "completed",
    summary: sections[0]!.body.split(/\n\n/)[0] ?? "",
    sections,
    provenance: []
  };
}

async function evaluatePairSemantically(controls: GeneratedControl[]) {
  const prompt = [
    evaluatorSystemPrompt(),
    "Evaluate the two V2 reports as a pair. The supplied chart-evidence packets are authoritative.",
    "The prior V1 reports are comparison controls, not evidence for V2 claims.",
    "Relationship context is entirely unspecified. Do not reward plausible assumptions.",
    "Tier differentiation must compare Core with Deep for this subject.",
    "",
    ...controls.map((control) => [
      `=== ${slug(control.subject)}/${control.family} ===`,
      "V2 EVIDENCE PACKET:",
      JSON.stringify(evaluatorEvidencePacket(control.evidence)),
      "V2 REPORT:",
      resultMarkdown(control.result),
      "PRIOR V1 REPORT:",
      resultMarkdown(control.baseline)
    ].join("\n"))
  ].join("\n\n");
  const parsed = parseJson(await openRouterJson(evaluatorModel, prompt, 18_000)) as { evaluations?: Phase5SemanticEvaluation[] };
  const expected = controls.map((control) => `${slug(control.subject)}/${control.family}`);
  const normalized = normalizeSemanticEvaluationKeys(parsed.evaluations ?? [], expected);
  const errors = validateSemanticEvaluation(expected, normalized);
  if (errors.length) throw new Error(`Semantic evaluator invalid for ${controls[0]?.subject}: ${errors.join("; ")}`);
  return normalized;
}

async function evaluateTonySemantically(
  result: ReportResult,
  baseline: ReportResult,
  evidence: ReturnType<typeof evidencePacket>
) {
  const prompt = [
    evaluatorSystemPrompt(),
    "Evaluate only the existing Tony Phase 4 Deep report. It was generated before the final shared-root evidence partition was applied; do not pretend otherwise.",
    "No Tony report was regenerated for Phase 5.",
    "Tony is a fixed historical control. Its current chapterEvidence shows the newer ownership plan for comparison, not the exact prose boundary that existed when this report was generated.",
    "Evaluate Tony's report against the selected complexes and provenance available in the completed Phase 5 baseline packet. Do not assign a failure merely because the later chapter partition would now route a supported root elsewhere.",
    "",
    "=== tony/deep ===",
    "CURRENT PHASE 4 EVIDENCE PACKET:",
    JSON.stringify(evaluatorEvidencePacket(evidence)),
    "EXISTING PHASE 4 REPORT:",
    resultMarkdown(result),
    "PRIOR V1 REPORT:",
    resultMarkdown(baseline)
  ].join("\n\n");
  const parsed = parseJson(await openRouterJson(evaluatorModel, prompt, 18_000)) as { evaluations?: Phase5SemanticEvaluation[] };
  const normalized = normalizeSemanticEvaluationKeys(parsed.evaluations ?? [], ["tony/deep"]);
  const errors = validateSemanticEvaluation(["tony/deep"], normalized);
  if (errors.length) throw new Error(`Tony semantic evaluator invalid: ${errors.join("; ")}`);
  return normalized;
}

async function evaluateRepetition(control: GeneratedControl) {
  const prompt = [
    "You are Astra's independent cross-chapter semantic-repetition evaluator.",
    "Ignore the intentionally canonical Identity chapter.",
    "Score 0-3: 3 means every chapter has a distinct mechanism and conclusion; 2 means minor overlap; 1 means a repeated mechanism or conclusion materially flattens the report; 0 means the report is an echo chamber.",
    "A recurring chart root is allowed only when the chapter develops a distinct consequence. Do not use unique-word counts.",
    'Return strict JSON: {"key":"subject/deep","score":0|1|2|3,"rationale":"one sentence","repeatedMechanisms":["..."],"offendingExcerpts":["exact short excerpt"]}.',
    "",
    `Key: ${slug(control.subject)}/deep`,
    control.result.sections.filter((section) => section.title !== "Identity")
      .map((section) => `## ${section.title}\n${section.body}`)
      .join("\n\n")
  ].join("\n");
  const parsed = parseJson(await openRouterJson(evaluatorModel, prompt, 7_000)) as Phase5RepetitionEvaluation;
  parsed.key = `${slug(control.subject)}/deep`;
  const errors = validateRepetitionEvaluation([parsed.key], [parsed]);
  if (errors.length) throw new Error(`Repetition evaluator invalid for ${control.subject}: ${errors.join("; ")}`);
  return parsed;
}

function normalizeSemanticEvaluationKeys(
  evaluations: Phase5SemanticEvaluation[],
  expectedKeys: string[]
) {
  if (evaluations.length !== expectedKeys.length) return evaluations;
  const remaining = new Set(expectedKeys);
  return evaluations.map((evaluation, index) => {
    if (remaining.has(evaluation.key)) {
      remaining.delete(evaluation.key);
      return evaluation;
    }
    const family = evaluation.key.split("/").at(-1);
    const familyMatch = [...remaining].find((key) => key.endsWith(`/${family}`));
    const key = familyMatch ?? [...remaining][0] ?? expectedKeys[index]!;
    remaining.delete(key);
    return { ...evaluation, key };
  });
}

function evaluatorSystemPrompt() {
  return [
    "You are Astra's independent Semantic Synthesis V2 evaluator.",
    "Score every requested report from 0 to 3. 0 is a clear failure; 1 is a material weakness; 2 is acceptable with minor revision; 3 is strong.",
    `Categories: ${phase5SemanticCategories.join(", ")}.`,
    "Astrological correctness means prose follows the supplied complexes, support paths, counterevidence, claim boundaries, and provenance.",
    "Importance means the selected structures deserve the chapter jobs and stronger omitted candidates are not obviously preferable.",
    "Genuine synthesis means the report combines multiple supported chart facts instead of listing or dumping technical astrology.",
    "The chapterEvidence array is the exact prose boundary for each chapter. Full complex support paths document provenance but do not authorize the prose to import every connected node.",
    "Specificity must come from chart evidence, never invented biography, categorical behavior, or another person's inner state.",
    "Dimensionality rewards resources, tensions, conditions, and counterevidence rather than one master problem.",
    "Context safety forbids inferred relationship status, condition, structure, intention, recency, history, or another person's motives.",
    "Semantic repetition judges repeated mechanisms and conclusions across chapters, not word overlap.",
    "Canonical Identity reuse across Core and Deep is required. Do not count the identical Identity chapter against tier differentiation or semantic repetition.",
    "Core complexes may remain present in Deep, but Deep must add distinct chapter mechanisms, consequences, and breadth beyond the canonical foundation.",
    "Return strict JSON only:",
    '{"evaluations":[{"key":"subject/family","scores":{"astrological_correctness":0,"importance":0,"genuine_synthesis":0,"specificity":0,"dimensionality":0,"tone":0,"usefulness":0,"tier_differentiation":0,"context_safety":0,"semantic_repetition":0},"rationales":{"astrological_correctness":"one sentence","importance":"one sentence","genuine_synthesis":"one sentence","specificity":"one sentence","dimensionality":"one sentence","tone":"one sentence","usefulness":"one sentence","tier_differentiation":"one sentence","context_safety":"one sentence","semantic_repetition":"one sentence"},"offendingExcerpts":{}}]}'
  ].join("\n");
}

function compareReports(before: ReportResult, after: ReportResult) {
  return {
    before: reportMetrics(before),
    after: reportMetrics(after),
    sectionWordChanges: Object.fromEntries(after.sections.map((section) => {
      const prior = before.sections.find((candidate) => candidate.title === section.title);
      return [section.title, {
        before: prior ? wordCount(prior.body) : 0,
        after: wordCount(section.body)
      }];
    }))
  };
}

function reportMetrics(result: ReportResult) {
  const prose = result.sections.map((section) => section.body).join("\n\n");
  const words = wordCount(prose);
  const chartReferences = (prose.match(/\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|Ascendant|Rising|Midheaven|house|conjunct|square|trine|sextile|opposition|configuration|dispositor|lunar phase)\b/gi) ?? []).length;
  return {
    words,
    grade: Number(measureReportReadability(prose).fleschKincaidGrade.toFixed(1)),
    chartReferencesPerThousandWords: words ? Number(((chartReferences / words) * 1000).toFixed(1)) : 0
  };
}

function evaluatorMarkdown(
  evaluations: Phase5SemanticEvaluation[],
  repetition: Phase5RepetitionEvaluation[],
  gate: ReturnType<typeof evaluateSemanticGate>
) {
  return [
    "# Semantic Synthesis V2 Phase 5 Independent Evaluation",
    "",
    `- Gate: ${gate.pass ? "PASS" : "FAIL"}`,
    `- Semantic average: ${gate.average} (minimum ${gate.thresholds.semanticAverage})`,
    `- Context-safety average: ${gate.contextSafetyAverage}${gate.thresholds.contextSafetyAverage === null ? " (no separate average gate; every context-safety score must be at least 2)" : ` (minimum ${gate.thresholds.contextSafetyAverage})`}`,
    `- Required category floor: ${gate.thresholds.minimumCategories.join(", ")} >= ${gate.thresholds.minimumCategoryScore}/3`,
    `- Deep repetition: ${gate.repetitionPass ? "PASS" : "FAIL"} (minimum ${gate.thresholds.repetitionScore}/3)`,
    "",
    ...evaluations.flatMap((evaluation) => [
      `## ${evaluation.key}`,
      "",
      ...phase5SemanticCategories.map((category) => `- ${category}: ${evaluation.scores[category]}/3 — ${evaluation.rationales[category]}`),
      ""
    ]),
    "## Cross-chapter semantic repetition",
    "",
    ...repetition.map((evaluation) =>
      `- ${evaluation.key}: ${evaluation.score}/3 — ${evaluation.rationale}`
    )
  ].join("\n");
}

function humanReviewWorksheet(
  controls: GeneratedControl[],
  tony: Pick<GeneratedControl, "result" | "baseline" | "evidence" | "deterministic" | "comparison">
) {
  const records = [
    ...controls.map((control) => ({ key: `${slug(control.subject)}/${control.family}`, ...control })),
    { key: "tony/deep", subject: "Tony Cecala", family: "deep" as const, ...tony }
  ];
  return [
    "# Semantic Synthesis V2 Phase 5 Human Review",
    "",
    "Status: pending reviewer judgment. Complete every line before the rollout decision.",
    "",
    "Rubric: astrological correctness; importance; genuine synthesis; specificity without invented biography; dimensionality; tone; usefulness; Core/Deep distinction; context safety; semantic repetition.",
    "",
    ...records.flatMap((record) => [
      `## ${record.key}`,
      "",
      `- V2 report: reports/${record.key.replace("/", "-")}-v2.md`,
      `- V1 report: reports/${record.key.replace("/", "-")}-v1.md`,
      `- Evidence: evidence/${record.key.replace("/", "-")}.json`,
      `- Word comparison: ${record.comparison.before.words} to ${record.comparison.after.words}`,
      `- Chart references/1,000 words: ${record.comparison.before.chartReferencesPerThousandWords} to ${record.comparison.after.chartReferencesPerThousandWords}`,
      `- Deterministic hard gate: ${record.deterministic.pass ? "PASS" : `FAIL — ${record.deterministic.hardGateIssues.join("; ")}`}`,
      "- Astrological correctness: pending",
      "- Importance of selected structures: pending",
      "- Genuine synthesis: pending",
      "- Specificity and biography boundary: pending",
      "- Dimensionality: pending",
      "- Tone and usefulness: pending",
      "- Core/Deep distinction: pending",
      "- Context safety: pending",
      "- Semantic repetition: pending",
      "- Materially better than V1: pending",
      "- Human verdict: pending",
      ""
    ])
  ].join("\n");
}

function decisionWorksheet(
  manifest: JsonObject,
  deterministicIssues: string[],
  calculationIssues: string[]
) {
  return [
    "# Semantic Synthesis V2 Phase 5 Rollout Decision",
    "",
    "Decision: PENDING HUMAN REVIEW",
    "",
    `- Machine decision: ${textFrom(manifest.machineDecision)}`,
    `- Deterministic hard gates: ${Boolean(manifest.hardGatePass) ? "PASS" : "FAIL"}`,
    `- Semantic evaluator: ${Boolean(recordFrom(manifest.semanticGate).pass) ? "PASS" : "FAIL"}`,
    `- Tony reports generated in Phase 5: ${String(manifest.tonyReportsGenerated)}`,
    "",
    "## Blocking evidence",
    "",
    ...(deterministicIssues.length || calculationIssues.length
      ? [...deterministicIssues, ...calculationIssues].map((issue) => `- ${issue}`)
      : ["- None from automated gates. Human review is still required."]),
    "",
    "GO requires every hard gate, every semantic threshold, and completed human review finding V2 materially more astrologically insightful than V1.",
    "HOLD means the architecture remains internal while specific failures are corrected.",
    "NO-GO means the synthesis architecture should not proceed in its current form."
  ].join("\n");
}

function reportMarkdown(subject: string, family: "core" | "deep", result: ReportResult, label: string) {
  return [
    `# ${subject} — ${family === "core" ? "Core" : "Deep"} — ${label}`,
    "",
    ...(result.status === "failed" ? [`Generation failed: ${result.error || "unknown error"}`, ""] : []),
    ...result.sections.flatMap((section) => [`## ${section.title}`, "", section.body, ""])
  ].join("\n");
}

function resultMarkdown(result: ReportResult) {
  return result.sections.map((section) => `## ${section.title}\n${section.body}`).join("\n\n");
}

function sectionBody(result: ReportResult, title: string) {
  return result.sections.find((section) => section.title === title)?.body ?? "";
}

async function openRouterJson(selectedModel: string, prompt: string, maxTokens: number) {
  const response = await fetch(`${OPENROUTER_DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: selectedModel,
      temperature: 0,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    })
  });
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
    usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  };
  if (!response.ok) throw new Error(payload.error?.message || `Evaluator failed with ${response.status}.`);
  const text = payload.choices?.[0]?.message?.content;
  if (!text?.trim()) throw new Error("Evaluator returned no text.");
  evaluatorInputTokens += payload.usage?.prompt_tokens ?? 0;
  evaluatorOutputTokens += payload.usage?.completion_tokens ?? 0;
  evaluatorSpend += payload.usage?.cost ?? 0;
  return text;
}

function parseJson(value: string) {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed) as unknown;
}

async function createDirectories() {
  for (const directory of ["reports", "evidence", "evaluator"]) {
    await mkdir(join(outputDir, directory), { recursive: true, mode: 0o700 });
  }
}

async function readRetainedGenerationFailures() {
  try {
    const content = await readFile(join(outputDir, "generation-failures.json"), "utf8");
    const parsed = JSON.parse(content) as Array<{ label?: unknown; attempt?: unknown; error?: unknown }>;
    return parsed
      .filter((failure) =>
        typeof failure.label === "string" &&
        Number.isInteger(failure.attempt) &&
        typeof failure.error === "string"
      )
      .map((failure) => ({
        label: failure.label as string,
        attempt: failure.attempt as number,
        error: failure.error as string
      }));
  } catch {
    return [];
  }
}

async function writeJson(path: string, value: unknown) {
  await writePrivate(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writePrivate(path: string, content: string) {
  await writeFile(path, content, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? clean(process.argv[index + 1]) : "";
}

function csvOption(name: string, fallback: string) {
  return (option(name) || fallback).split(",").map((value) => value.trim()).filter(Boolean);
}

function integerOption(name: string, fallback: number) {
  const value = option(name);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`${name} must be an integer.`);
  return parsed;
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function recordFrom(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function textFrom(value: unknown) {
  return typeof value === "string" ? value : "";
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function wordCount(value: string) {
  return value.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu)?.length ?? 0;
}

function git(args: string[]) {
  return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" }).trim();
}
