---
title: Astra Semantic Synthesis V2 Phase 5 Evaluation
status: complete
decision: HOLD
type: evaluation
project: Astra Clean Start
created: 2026-07-26
updated: 2026-07-26
source_revision: c2fcafd1125525aa35fb5be6f21318c30e5a64d3
evaluation_version: 2.0.0-phase-5
---

# Astra Semantic Synthesis V2 Phase 5 Evaluation

## Decision

**HOLD.**

The deterministic architecture passes. The report-writing path does not pass the semantic thresholds and must not widen internally. Phase 6 heading and presentation work remains blocked.

## Evaluated controls

Trusted charts:

- Tony Cecala — existing Phase 4 Deep control only; no Tony report was generated.
- Felicia Weiss — fresh V2 Core and Deep.
- Cheyenne Autumn — fresh V2 Core and Deep.
- Marissa Yahil — fresh V2 Core and Deep.
- Brandi McCulley — calculation-only structural control.
- Rachel Ijames — calculation-only structural control.

Brandi and Rachel were included because their deterministic structural fingerprints differ from Tony's and from each other. They prevent acceptance based only on charts structurally similar to Tony.

Calculation matrix for all six charts:

- Tropical + Whole Sign + full;
- Tropical + Placidus + full;
- Sidereal + Whole Sign + full;
- Sidereal + Placidus + full;
- Tropical + Whole Sign + signs-and-aspects-only.

Report controls used the production writer `anthropic/claude-sonnet-5`. Independent evaluation used `openai/gpt-5.6-terra` at temperature zero.

## Delivered evidence

The private packet is:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-26-phase-5-evaluation-v2`

It contains:

- six V1/V2 Core or Deep report pairs;
- Tony's prior V1 and existing Phase 4 Deep report;
- selected complexes for every V2 report;
- chapter ownership and interpretive jobs;
- support paths and complete raw-fact provenance;
- retained counterevidence and qualifiers;
- omitted high-scoring candidates with omission reasons;
- five-mode trusted-chart fingerprints;
- deterministic results;
- independent semantic scores and rationales;
- independent cross-chapter repetition reviews;
- completed human review;
- the final HOLD decision.

## Hard-gate result

Passed:

- every retained Phase 0–4 deterministic gate;
- deterministic construction across all trusted charts and calculation modes;
- complete provenance for every meaning complex;
- independent support for every strong complex;
- no house, angle, cusp, or house-ruler leakage in signs-and-aspects-only controls;
- canonical Identity reuse between Core and Deep for each report control;
- distinct Core and Deep complex selections;
- exact ordinary-report fallback coverage;
- relationship context cannot change canonical Identity;
- all six generated non-Tony reports completed;
- zero Tony reports generated.

The accepted Felicia Core result required one additional orchestration attempt. The rejected attempt remains in private telemetry with its validator reasons.

## Semantic thresholds

| Gate | Required | Observed | Result |
|---|---:|---:|---|
| Overall semantic average | 2.6/3 | 2.129/3 | Fail |
| No category below | 2/3 | Multiple 0–1 scores | Fail |
| Context-safety average | 2.8/3 | 2.429/3 | Fail |
| Every Deep repetition score | 2/3 | 1, 1, 1, 2 | Fail |

Deep repetition:

- Felicia: 1/3.
- Cheyenne: 1/3.
- Marissa: 1/3.
- Tony: 2/3.

## Human review

### What works

- Felicia Core and Marissa Core are more focused and useful than their V1 controls.
- Meaning-complex selection creates real chart-specificity rather than generic chapter filler.
- Core and Deep use recognizably different evidence budgets.
- Reports generally retain counterweights, capacities, and practical conditions.
- Tone is usually calm, direct, and nonfatalistic.
- Deterministic evidence and provenance are inspectable enough to diagnose every failure below.

### What blocks rollout

1. Evidence fidelity

   - Felicia Deep routes a Leo Moon through Mars and Neptune, which its selected rulership evidence does not support.
   - Tony Deep describes Neptune as sitting across from both legs of a T-square and adds Chiron where Chiron is not selected chapter support.
   - Several reports add orb precision or placement details not surfaced by their chapter packet.

2. Unsupported biography and categorical behavior

   - Tendencies become established habits, recovery methods, career behavior, decision history, or social effect.
   - Hedging words sometimes surround claims that remain too biographically specific.

3. Context safety

   - Cheyenne Deep invents early-home memories, family dynamics, household emotional truth, and privileged perception of those dynamics from natal symbolism alone.

4. Deep repetition

   - Felicia repeats Moon, Mars, Pluto, and Saturn roots across paired chapters.
   - Cheyenne repeats Venus, Jupiter oppositions, the conjunction cluster, and Capricorn Moon across several chapters.
   - Marissa repeats the stellium/final-dispositor mechanism across Work and Gifts and the Saturn-anchored Node across Growth and Integration.
   - Tony repeats Neptune, the T-square, and delay/check conclusions across too many chapters.

5. Selection efficiency

   - Some exploratory or duplicate-root complexes receive chapter ownership while stronger omitted candidates could supply cleaner, more distinct evidence.

## Rollout boundary

Keep V2 internal as a deterministic evidence engine. Do not widen V2 report generation and do not begin Phase 6.

The next bounded implementation should:

- make prose evidence a strict subset of the selected chapter packet;
- prevent unsupported biography, categorical behavior, and inner-state claims;
- improve Deep chapter ownership so repeated roots yield different mechanisms and conclusions or are replaced by stronger omitted candidates;
- retain every Phase 0–5 deterministic and evaluator gate;
- reuse the existing control packet instead of generating another Tony report.
