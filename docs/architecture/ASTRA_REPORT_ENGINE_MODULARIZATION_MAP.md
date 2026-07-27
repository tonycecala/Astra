# Astra Report Engine Modularization Map

## Public façade

`packages/astrology/src/index.ts` remains the unchanged `@astra/astrology` entrypoint. It owns composition and re-exports only; callers must not need to know where an implementation lives.

## Responsibility seams

| Responsibility | Current or target owner | Boundary |
| --- | --- | --- |
| Relationship-context normalization | `report/relationshipContext.ts` | Converts untrusted request context to typed, neutral fields. |
| Editable prompt and evaluation policy | `rules/report-policies.json` + `report/rules/catalog.ts` + `report/promptPolicies.ts` | Static, schema-validated editorial data with context-aware assembly. |
| Chart normalization and structural facts | existing dedicated modules | Pure astrological calculation. |
| Meaning-complex graph and views | existing dedicated modules | Evidence ranking and deterministic chapter assignment. |
| Section evidence cards | `index.ts`, pending extraction | Converts selected complexes into writer-ready evidence. |
| Prompt construction | `report/promptBuilderContracts.ts` | Combines immutable cards, rules, and report-family constraints. |
| Prose validation | `report/draftParsing.ts`, `sectionParsing.ts`, `proseValidation.ts`, `sectionValidation.ts` | Parses generated prose and rejects unsupported or unsafe output. |
| Phase 5 evaluator | `scripts/lib`, pending shared detector extraction | Scores output and applies rollout thresholds. |
| Provider and retry orchestration | `report/openaiAdapter.ts`, `openRouterAdapter.ts`, `providerResponse.ts`, `providerUsage.ts`, `retryClassification.ts`, `retryOrchestration.ts` | Calls configured model providers only when explicitly requested and preserves retry metadata. |

## Invariants

- No prompt or rule wording changes during this refactor.
- No live provider call is required for test coverage.
- The public export surface remains stable.
- Rules are ordered JSON data; executable detector mechanics remain TypeScript.
- Phase 0–5 deterministic gates are required after every extraction.

## Completed extractions

1. Relationship-context normalization.
2. Prompt voice, safety, evidence, chapter-closing, and Phase 5 threshold policy into the schema-validated catalog.
3. Relationship-context application, report-level voice planning, chapter-role ownership, evidence ownership, and focused safety boundaries into `report/promptPolicies.ts`.
4. Prompt builders, parsing/prose validation, provider transport, and shared retry orchestration behind the unchanged façade.

## Next safe seams

1. Section evidence cards, only if a concrete ownership seam emerges.
