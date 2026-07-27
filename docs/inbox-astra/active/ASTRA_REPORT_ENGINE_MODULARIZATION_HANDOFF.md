---
title: Astra Report Engine Modularization Handoff
status: active
owner: Codex
created: 2026-07-27
branch: codex/astra-report-rule-catalog-v2
base_commit: 37dd29b
---

# Astra Report Engine Modularization Handoff

## Current state

The worktree is clean on `codex/astra-report-rule-catalog-v2`.

The unchanged public façade remains `packages/astrology/src/index.ts`. No model calls or customer report generations were made during this refactor.

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

## Next safe extractions

Proceed one subsystem at a time, with the same gates after each:

1. Prompt builders: move the monolithic, Deep, and sectioned Core prompt assemblers behind internal modules while preserving exact text and ordering.
2. Parsing and prose validation: move parsing, section validation, and retry classification behind internal modules; do not weaken or widen any detector.
3. Provider and retry orchestration: move OpenAI/OpenRouter adapters and section-generation orchestration behind internal modules; preserve the existing concurrency and retry behavior.
4. Finish with a small façade cleanup only after all behavior fingerprints still pass.

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
