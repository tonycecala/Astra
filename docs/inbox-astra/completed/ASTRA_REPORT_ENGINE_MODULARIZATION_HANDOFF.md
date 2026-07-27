---
title: Astra Report Engine Modularization Handoff
status: completed
owner: Codex
created: 2026-07-27
branch: codex/astra-report-engine-modularization
base_commit: 5d9580f
completed: 2026-07-27
---

# Astra Report Engine Modularization Handoff

## Current state

The unchanged public façade remains `packages/astrology/src/index.ts`. No model calls or customer report generations were made during this refactor. Pre-existing unrelated worktree changes were preserved.

## Continuation status

Completed on `codex/astra-report-engine-modularization` from `5d9580f`:

- Prompt builders: `report/promptBuilderContracts.ts` owns the monolithic debug, Deep thesis/chapter, and enriched-Core prompt contracts.
- Parsing and validation: `draftParsing.ts`, `sectionParsing.ts`, `proseValidation.ts`, and `sectionValidation.ts` own draft/section parsing and prose/section validation.
- Provider and retry orchestration: `openaiAdapter.ts`, `openRouterAdapter.ts`, `providerResponse.ts`, `providerUsage.ts`, `retryClassification.ts`, and `retryOrchestration.ts` own transport, response handling, usage, retry classification, and the shared Deep/Core retry loop.

The façade retains its public API and only composes existing dependencies into these internal modules. No prompt wording, report headings, output contracts, provider protocol, attempt count, retry metadata, concurrency, or deterministic behavior was changed.

Verified after every completed extraction and again at closeout: astrology public-API and rule-catalog fingerprints; Semantic Synthesis V2 Phases 1–5; Deep-quality fake-provider coverage; lint; typecheck; production build; and `git diff --check`.

## Completed commits

1. `22e7091 refactor(astrology): add validated report rule catalog`
   - Extracted relationship-context normalization into `report/relationshipContext.ts`.
   - Added the schema-validated editable catalog at `rules/report-policies.json` and `report/rules/catalog.ts`.
   - Added public-API and rule-catalog fingerprints.

2. `37dd29b refactor(astrology): isolate report policies and detectors`
   - Extracted relationship-context application, report-level voice planning, chapter-role ownership, evidence ownership, and focused safety boundaries into `report/promptPolicies.ts`.
   - Extracted the Phase 5 semantic detector registry into `report/rules/detectors.ts`.
   - Updated the Phase 5 evaluator to consume the named detector rules.
   - Synced the already-declared `zod` package dependency into `package-lock.json`.

## Verified invariants

All passed after `37dd29b`:

- `npm run test:astrology-public-api`
- `npm run test:report-rule-catalog`
- `npm run test:semantic-synthesis-v2-phase-1` through `phase-5`
- `npm run test:report-deep-quality`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `git diff --check`

The Deep-quality suite uses a fake provider and verifies section concurrency, retries, prompt contracts, and metadata without a live model call.

## Completion evidence

All planned seams are extracted. The remaining `index.ts` functions are intentionally thin internal façade adapters or report-result composition; they preserve the unchanged `@astra/astrology` contract.

## Hard constraints

- Preserve prompt text, report headings, output behavior, public API, database contracts, routes, UI, and every Phase 0–5 deterministic gate.
- Keep astrology calculation, selection, and detector mechanics in TypeScript; keep editable editorial policy in the validated JSON catalog.
- Do not call a model or generate a customer report.
- Do not regenerate Tony controls.
- Do not begin heading, presentation, or semantic-remediation work.
- Stop at HOLD only for a genuine unresolved Level 0, 1, or 2 decision:
  - Level 0: safety, privacy, trust, or integrity risk.
  - Level 1: public contract or persisted-data change.
  - Level 2: material product-meaning decision.

## Orientation

- Architecture map: `docs/architecture/ASTRA_REPORT_ENGINE_MODULARIZATION_MAP.md`
- Public entrypoint: `packages/astrology/src/index.ts`
- Current policy module: `packages/astrology/src/report/promptPolicies.ts`
- Current rule catalog: `packages/astrology/rules/report-policies.json`
- Current semantic detectors: `packages/astrology/src/report/rules/detectors.ts`
- Phase 5 evaluator: `scripts/lib/semantic-synthesis-v2-evaluation.ts`

## Recommended continuation prompt

```text
Continue the Astra report-engine modularization from commit 37dd29b using docs/inbox-astra/active/ASTRA_REPORT_ENGINE_MODULARIZATION_HANDOFF.md. Extract prompt builders, parsing/validation, and provider orchestration one subsystem at a time behind the unchanged @astra/astrology façade. Preserve prompt text, output behavior, public API, contracts, and every Phase 0–5 gate. Make no model calls or report generations. After each extraction run catalog and API fingerprints, Phase 1–5 deterministic gates, Deep-quality tests, lint, typecheck, production build, and diff validation; stop at HOLD only for a genuine Level 0, 1, or 2 blocker.
```
