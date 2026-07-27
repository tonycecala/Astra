---
title: "Use broad gates for discovery and single-blocker loops for remediation"
type: "skill"
description: "Akashic skill artifact."
status: "active"
project: "astra"
created: "2026-07-27"
date: "2026-07-27"
updated: "2026-07-27"
timestamp: "2026-07-27"
okf_version: "0.1"
tags: ["skill", "evaluation", "remediation", "cost-control"]
related: []
---
# Use broad gates for discovery and single-blocker loops for remediation

## Problem

Phase 5 initially combined multiple report generations, deterministic checks, semantic scoring, repetition review, and human review. That broad pass was valuable for finding the failure landscape and deciding rollout readiness, but it was inefficient as the repair loop:

- Failures were entangled.
- Attribution was weak.
- Each rerun spent time and model cost on areas unrelated to the active defect.
- One failed gate could obscure the result of otherwise useful changes.

## Signals

The targeted Marissa Gifts sequence exposed separate shared-path defects that a broad rerun would have blurred together:

- An invented aspect inherited from a dispositor path.
- A ruled-house field presented as a planet placement.
- Internal orb precision leaking into prose.
- Generic dispositor-chain expansion beyond the supplied relationship.
- Personal activation inflated beyond natal relevance.

The narrow approach made each cause, fixture, correction, and result independently inspectable.

## Root Cause

Discovery and remediation were being treated as the same workflow.

Broad cohort gates answer two questions: what is broken, and is the product ready to ship? They are intentionally wide.

Remediation needs to answer a different question: why is this one result wrong? That requires a small causal loop with one subject, one chapter, one blocker, and one discriminating test.

## Resolution

Use two modes:

1. **Broad discovery and rollout mode:** Run the cohort, deterministic gates, semantic scoring, repetition checks, and human review to identify the failure landscape or make a release decision.
2. **Single-blocker remediation mode:** Isolate one observed failure, trace its evidence path, add a focused fixture, correct the shared cause, and regenerate only the affected unit.

The single-blocker loop gives clearer causality, a smaller blast radius, cheaper evidence, and stronger regression fixtures.

### Targeted remediation protocol

1. Select one observed sentence-level blocker and one chapter.
2. State one root-cause hypothesis and run one discriminating trace through the selected evidence packet.
3. Add an exact rejected-prose fixture before changing the shared path.
4. Dry-run the validator against the known failure and several valid paraphrases before making a paid generation call.
5. Correct the narrowest shared evidence, serialization, or generation rule that caused the defect.
6. Revalidate existing output first; generate only the affected chapter when new prose is actually needed.
7. Bound retries, persist usage before local validation, and record every attempt and cost.
8. Stop with PASS or a concrete HOLD. Do not widen scope inside the blocker loop.
9. Run the full deterministic, semantic, repetition, and human-review suite only after the blocker set is complete or at a rollout milestone.

## Prevention

### Paid-generation preflight

Single-blocker scope does not automatically mean low cost. Narrow regexes and retry-harness defects caused avoidable regeneration in the Marissa controls. The paid-call preflight is therefore part of the method: test the matcher against the prior failing prose plus legitimate wording variants, and reuse already generated output whenever the corrected validator can evaluate it.

Persist response usage before local validation so a failed local check does not erase cost evidence. Bound retries explicitly.

### Prompt-attractor control

A prohibition can reproduce the language it is meant to prevent. The Marissa Blind Spots control kept generating rebuttal essays about accurate social perception because the claim boundary, chapter job, prompt, and retry feedback repeated that frame.

Before another paid call:

- Test the gate against affirmative failures and explicitly negated versions of the same language.
- Evaluate claims clause by clause so `not X, but Y` does not hide an affirmative claim in `Y`.
- Rewrite generation guidance constructively: name the bounded mechanism the chapter should develop instead of listing forbidden conclusions repeatedly.
- Rewrite retry feedback the same way. Do not feed the failed semantic frame back to the model when a positive instruction can replace it.
- Keep human review in the loop. A chapter can be mechanically safe yet still spend all its words circling the prohibited claim.

### Decision rule

Use a broad run to learn what is broken and whether the product can ship. Use a single-blocker loop to learn why one thing is broken and fix it with attributable evidence. Return to the broad run only when the bounded repairs are ready for integration.

## Related Files

- `docs/evaluations/ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_EVALUATION.md`
- `scripts/run-marissa-gifts-dispositor-control.mts`
- `scripts/run-marissa-gifts-orb-control.mts`
- `scripts/run-marissa-gifts-personal-activation-control.mts`

## Related ADRs
- None yet.
