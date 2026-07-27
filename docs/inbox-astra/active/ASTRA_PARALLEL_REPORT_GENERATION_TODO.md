---
title: Astra Parallel Report Generation
status: proposed
type: future-implementation-brief
project: Astra Clean Start
author: Tony + Codex
created: 2026-07-27
priority: P1
audience: Codex / engineering agents
mission: Reduce report latency by generating one report tier's independent chapters concurrently without weakening evidence, validation, or report assembly.
depends_on: ASTRA_SEMANTIC_SYNTHESIS_V2_HANDOFF.md
---

# Parallel Report Generation TODO

## Goal

Cut report-generation latency by generating the chapters within one requested report tier concurrently:

- Core: dispatch its four chapter requests together.
- Deep: dispatch its eight chapter requests together.

This implementation covers one requested tier at a time: Astra parallelizes that tier's independent chapters after their evidence packets are complete. Parallel generation across Core and Deep is outside this brief's scope, not prohibited by the architecture.

Every chapter must read from the same immutable chart snapshot, canonical Identity, relationship context, signal inventory, and deterministic evidence plan. No chapter may consume prose produced by another chapter.

## Proposed Flow

1. Calculate the chart and freeze the report basis.
2. Build and validate all evidence packets before prose generation begins.
3. Create a generation manifest containing every expected request.
4. Dispatch all independent chapters for the requested tier through a bounded worker pool: four for Core or eight for Deep.
5. Track each outbound request with a stable report ID, tier, chapter, attempt number, evidence-packet hash, prompt-version hash, and idempotency key.
6. Match every response to its manifest entry before accepting it.
7. Validate each response independently.
8. Retry only the failed request; never regenerate successful siblings.
9. Assemble the report only after every required entry is present and valid.
10. Run existing report-level semantic, repetition, safety, and calculation-mode gates on the assembled result.

## Guardrails

- Do not parallelize any request that depends on prose from another request.
- Preserve canonical Identity verbatim across tiers.
- Keep this implementation scoped to parallel chapters within the requested report tier. Cross-tier parallelism may be considered separately.
- All chapters within that tier must use the same immutable inputs and their preassigned chapter evidence.
- Concurrency must be configurable and bounded to respect provider rate limits.
- Preserve deterministic output ordering regardless of response arrival order.
- Reject missing, duplicate, stale, mismatched, or late responses.
- Make retries idempotent and record all attempts.
- Cancellation must stop outstanding work without corrupting completed entries.
- Existing headings, UI, routes, database contracts, public contracts, and semantic gates remain unchanged.

## Acceptance

- A Core run starts four chapter requests concurrently after shared evidence preparation.
- A Deep run starts eight chapter requests concurrently after shared evidence preparation.
- This change does not introduce or require cross-tier parallel generation.
- A simulated out-of-order response set assembles correctly.
- A single failed request retries alone and does not duplicate accepted work.
- Mismatched hashes, duplicate responses, and stale attempts are rejected.
- Serial and parallel runs produce the same required sections, evidence ownership, and gate results.
- Peak concurrency never exceeds configuration.
- Instrumentation reports queue time, generation time, validation time, retries, total latency, and estimated serial-versus-parallel savings.
- End-to-end test data demonstrates a material latency reduction without lower semantic, safety, or repetition scores.

## Recommended First Slice

Implement tier-local chapter parallelism behind one shared manifest and bounded worker pool. Begin with Core's four chapters, then use the same path for Deep's eight chapters. Keep deterministic assembly order and all report-level validation after every chapter has returned.
