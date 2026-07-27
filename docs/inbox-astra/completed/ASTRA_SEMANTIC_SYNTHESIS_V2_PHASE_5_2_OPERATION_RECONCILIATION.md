---
title: "Semantic Synthesis V2 Phase 5.2 operation-reconciliation experiment"
status: completed
type: evaluation-and-implementation-brief
project: Astra Clean Start
created: 2026-07-27
updated: 2026-07-27
decision: HOLD
baseline_commit: 3bf843c
phase_5_1_decision: practical GO
---

# Semantic Synthesis V2 Phase 5.2 Operation Reconciliation

## Outcome

Phase 5.2 is **HOLD**. The experiment produced useful upstream learning but did
not produce a reviewable report. The candidate prompt change was removed, so
the committed Phase 5.1 claim-planned writer remains the active production
path. Phase 6 was not started.

## Hypothesis

The accepted Cheyenne 5.1 report repeated weighing, balancing, adjustment, and
grounding across otherwise distinct chapters. Astra already reconciled most
exact fact labels. The sharper hypothesis was that the semantic bridges
themselves supplied repeated response verbs:

- opposition: `a polarity that requires comparison`;
- square: `friction that requires adjustment`;
- quincunx: `a mismatch that requires calibration`.

The proposed repair separated descriptive aspect meaning from one positively
reserved conclusion operation per chapter. The operation names were
deterministically unique, and the paragraph claim plan required each chapter
to finish only its owned job.

## Deterministic result

The candidate implementation passed:

- report-rule catalog and public API fingerprints;
- Semantic Synthesis V2 Phases 1–5;
- report-model strategy and Deep-quality tests;
- lint, typecheck, production build, and diff validation.

Exact fixtures proved that duplicate chapter operations failed before a
provider call and that a counterweight opposition no longer prescribed
weighing, balancing, adjustment, or calibration.

## Canary result

Two bounded Cheyenne Deep outer attempts were made with unchanged code between
them. Core and Identity were reused. Tony, Felicia, and Marissa were not
generated. No sentence-specific prompt patch or weakened validator was applied.

### Attempt 1

Packet:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-cheyenne-operation-reconciled-phase-5-2-v15`

- Result: failed before a complete report.
- Shared failure: Blind Spots exhausted its built-in chapter retries after
  adding unnecessary orb precision.
- Internal orchestration attempts: 12.
- Generation: 59,156 input tokens, 6,836 output tokens,
  **$0.186672** estimated.
- Evaluation: 82,990 input tokens, 2,557 output tokens,
  **$0.084623375** estimated.
- Total: **$0.271295375** estimated.

### Attempt 2

Packet:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-cheyenne-operation-reconciled-phase-5-2-v16`

- Result: failed at the same Blind Spots unnecessary-orb-precision boundary.
- The runner then incorrectly sent an orphaned Core control to the semantic
  pair evaluator and terminated before writing a manifest.
- Exact provider cost was not retained because of that runner defect. Do not
  invent or estimate it from the first attempt.

Because neither attempt produced a complete Deep report, 5.2 has no valid
correctness, safety, usefulness, or repetition score.

## Adoption decision

The operation-reconciliation prompt is **not adopted**. Two identical
generation failures do not prove that the operation idea caused the orb
language, but they do prove that the changed packet did not meet the required
report-completion reliability. Keeping an empirically unreviewed prompt would
regress the approved Phase 5.1 baseline.

The durable prompt lesson is narrower:

- keep the selected fact descriptive;
- state one positive chapter job;
- avoid repeating a catalogue of every prohibited neighboring job;
- do not treat deterministic packet validity as report-quality evidence.

The candidate was therefore removed and the prompt version returned to
`astra-report-writer-2026-07-semantic-synthesis-v2-claim-planned`.

## Evaluation-harness repair retained

The failed second attempt exposed a real deterministic runner defect. Semantic
pair evaluation now requires both a completed Core and completed Deep control.
An incomplete candidate remains a generation HOLD and is never sent to the
pair evaluator. Exact rejected and accepted fixtures cover this control flow.

This repair changes only the private Phase 5 evaluator. It does not change
report prose, public APIs, contracts, routes, schemas, headings, or UI.
