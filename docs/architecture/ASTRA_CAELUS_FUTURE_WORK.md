---
title: Astra Caelus Future Work
status: proposed
type: future-work
project: Astra Clean Start
created: 2026-07-27
source:
  - ../evaluations/ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_EVALUATION.md
  - ../inbox-astra/completed/ASTRA_EVIDENCE_GROUNDED_WRITING_AND_CAELUS_COMPARISON_BRIEF.md
---

# Astra Caelus Future Work

## Decision boundary

Caelus is a **reference-only comparison engine**. Astra remains the sole
calculation authority and retains its evidence selection, chapter ownership,
bounded meanings, prohibited inferences, and report contracts.

This is a future-work menu, not an approved migration plan. It must not reopen
the rejected Phase 5.2 operation-reconciliation prompt or resume
sentence-level detector work.

## What the comparison established

The July 2026 isolated Caelus `0.23.0` comparison reran four trusted charts
through Caelus Birth's own UTC conversion and explicitly requested Tropical /
Whole Sign settings. Local-time-as-UT and an assumed settings default were not
the source of disagreement.

- Sun through Pluto: 40 positions, zero sign or house mismatches; maximum
  longitude delta 0.5003 arcminute.
- Chiron: one sign/house mismatch across four positions; maximum delta 54.5235
  arcminutes.
- Retrograde: zero mismatches.
- Aspects: 78 common; Astra found 90 and Caelus 79 under different point and
  orb policy.
- Pattern and dispositor taxonomies differ enough that swapping engines would
  create a second authority rather than a simple verification layer.

## Future work candidates

### 1. Chart-input certainty policy — highest value when birth precision becomes a product concern

Caelus treats input provenance and certainty as first-class and down-weights
time-sensitive facts when a recorded birth time is inexact. Astra can adopt the
principle without adopting Caelus:

- retain the recorded IANA time zone and derived UTC instant together;
- distinguish exact, reported, approximate, and unknown birth-time confidence;
- suppress or qualify time-sensitive Moon, angle, house, and cusp claims when
  the input cannot support them;
- keep the calculation setting manifest explicit: zodiac, house system, point
  set, aspect policy, and calculation mode.

**Entry condition:** a product decision to collect or represent birth-time
confidence. Do not add schema or UI fields merely for parity aesthetics.

### 2. Private atom identifiers and writer citations — highest leverage for auditability

Caelus's useful pattern is a ranked list of typed fact atoms with stable IDs,
salience, certainty, and auditable citations. Astra already has selected facts
and writer-packet support markers; a future internal refinement could:

- give every selected atomic fact a stable, versioned ID;
- retain source calculation settings and confidence beside that ID;
- require the writer's private support marker to name the IDs it used;
- retain a reviewer-only citation audit showing fact → bounded contribution →
  chapter conclusion.

This is private evidence infrastructure. Do not expose IDs, graph traversal,
or provenance plumbing in customer report prose.

### 3. Separate salience from certainty — useful only if selection decisions need more explainability

Caelus distinguishes how prominent a fact is from how reliable its input is.
Those are different questions. A future Astra planner could preserve that
separation:

- **salience:** why this fact competes for limited chapter space;
- **certainty:** whether the birth input and calculation mode support using it
  at all.

Keep the existing 2–3 writer-fact limit and fact-specific semantic bridge. Do
not turn the distinction into extra prose qualifications or additional
sentence-level detectors.

### 4. Developer-only parity harness — useful for regression detection, not production facts

If calculation changes become likely, build a pinned, local Caelus comparison
tool outside Astra's runtime dependency graph. It should:

- take an explicit manifest of local birth data, IANA zone, UTC instant,
  zodiac, house system, point set, and aspect/orb policy;
- compare positions, signs, houses, retrogrades, and only policy-compatible
  aspects;
- classify disagreements by point/policy/version rather than declaring one
  engine wrong;
- preserve the Chiron discrepancy as a tracked diagnostic until independently
  resolved;
- run only against trusted fixtures and never generate a customer report.

**Entry condition:** an intended calculation-engine change, a new point set,
or an unexplained trusted-chart regression.

### 5. Rights-aware interpretive corpus research — optional and separate from the engine

Caelus confirms the value of keeping calculation, evidence selection, and
interpretive text separate. If Astra ever evaluates a rule corpus:

- accept only sources with explicit usable rights;
- attach source and rights metadata to each passage;
- store selector and supporting atom IDs with every rule;
- treat corpus text as a bounded meaning resource, never as a new chart fact;
- do not copy `gratis-not-pd` or otherwise unlicensed material.

This is content and rights research, not a reason to import Caelus's corpus or
change the current writer path.

## Explicit non-goals

- Do not make Caelus a production dependency or second calculation authority.
- Do not change Astra's Tropical/Sidereal or Whole Sign/Placidus user choices
  based on the comparison.
- Do not use Caelus defaults implicitly; every comparison must declare its
  settings and UTC conversion.
- Do not regenerate Tony or any report merely to pursue this research.
- Do not revive Phase 5.2 or add phrase-specific remediation detectors.

## Recommended next trigger

Leave this document dormant until Astra has a concrete calculation change or a
product decision about inexact birth times. Then choose **one** candidate above,
write a bounded brief, and run the existing deterministic and production gates
before any customer-facing adoption.
