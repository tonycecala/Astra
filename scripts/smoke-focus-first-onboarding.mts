import assert from "node:assert/strict";
import {
  chartArrivalRewriteRequestSchema,
  chartArrivalViewSchema,
  chartRequestContextSchema,
  explorerFocusKeys,
  explorerFocusSchema,
  updateExplorerFocusSchema
} from "@astra/contracts";
import {
  deterministicArrivalGlimpse,
  deterministicFirstJourneyStep,
  EXPLORER_FOCUS_INTENTS
} from "../apps/astra-web/lib/explorer-focus";

const evidence = [
  { key: "sun" as const, label: "Sun", value: "Gemini" },
  { key: "moon" as const, label: "Moon", value: "Virgo" },
  { key: "rising" as const, label: "Rising", value: "Libra" },
  { key: "precision" as const, label: "Chart detail", value: "Birth time and place included" }
];
const privateQuestion = "Will my secret relationship survive this exact crisis?";
const forbidden = ["destined", "guaranteed", "will happen", "must become", "your fate"];
const words = (value: string) => value.trim().split(/\s+/).length;

for (const key of explorerFocusKeys) {
  const selected = updateExplorerFocusSchema.parse({ status: "selected", key });
  assert.equal(selected.status, "selected");
  if (selected.status === "selected") assert.equal(selected.key, key);
  assert.ok(EXPLORER_FOCUS_INTENTS[key]);
}
assert.equal(updateExplorerFocusSchema.parse({ status: "skipped" }).status, "skipped");
assert.throws(() => updateExplorerFocusSchema.parse({ status: "selected", key: "invalid" }));
assert.throws(() => updateExplorerFocusSchema.parse({ status: "selected", key: "learn_chart", question: "x".repeat(281) }));

const variants = [
  ...explorerFocusKeys.map((key) => ({ schemaVersion: 1 as const, status: "selected" as const, key })),
  { schemaVersion: 1 as const, status: "skipped" as const }
];

for (const focus of variants) {
  const glimpse = deterministicArrivalGlimpse(evidence, focus);
  const journey = deterministicFirstJourneyStep(evidence, focus);
  assert.ok(words(glimpse) >= 45 && words(glimpse) <= 90, `Arrival length ${words(glimpse)} for ${focus.status === "selected" ? focus.key : "skipped"}`);
  assert.ok(words(journey.body) >= 90 && words(journey.body) <= 150, `Journey length ${words(journey.body)} for ${focus.status === "selected" ? focus.key : "skipped"}`);
  assert.ok(!glimpse.includes(privateQuestion));
  assert.ok(!journey.body.includes(privateQuestion));
  for (const fragment of forbidden) {
    assert.ok(!glimpse.toLowerCase().includes(fragment));
    assert.ok(!journey.body.toLowerCase().includes(fragment));
  }
  chartRequestContextSchema.parse({ explorerFocus: focus });
  chartArrivalRewriteRequestSchema.parse({
    evidence,
    deterministicGlimpse: glimpse,
    deterministicJourneyBody: journey.body,
    explorerFocus: focus,
    question: privateQuestion
  });
  chartArrivalViewSchema.parse({
    id: "arrival:test",
    chartRequestId: "chart:test",
    title: "Your Astra has arrived",
    recognition: "Astra read the supported chart shape.",
    evidence,
    deterministicGlimpse: glimpse,
    glimpse,
    generationSource: "deterministic",
    promptVersion: "focus-first-test-v1",
    explorerFocus: focus,
    firstJourneyStep: { ...journey, promptVersion: "focus-first-test-v1" },
    state: "available",
    createdAt: new Date().toISOString()
  });
}

const persisted = explorerFocusSchema.parse({
  schemaVersion: 1,
  status: "selected",
  key: "change_transition",
  question: privateQuestion,
  selectedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
assert.equal(persisted.status, "selected");
if (persisted.status === "selected") assert.equal(persisted.question, privateQuestion);

console.log(`focus-first onboarding smoke: ${variants.length} copy variants, privacy and contracts passed`);
