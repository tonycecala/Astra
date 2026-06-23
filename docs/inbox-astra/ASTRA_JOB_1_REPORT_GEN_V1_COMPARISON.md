# Astra Job 1 Report Generation V1 Comparison

Status: active quarry note
Date: 2026-06-23

## Purpose

Compare the current Astra v2 report-generation path against the working v1 report system and remove behavior that was invented instead of quarried.

## V1 Sources Inspected

- `/Users/tony/Documents/Projects/Astria/lib/report-v2/build-markdown-writer-prompt.ts`
- `/Users/tony/Documents/Projects/Astria/lib/report-v2/generate-astra-report-v2.ts`
- `/Users/tony/Documents/Projects/Astria/lib/report-v2/validate-report-v2-markdown.ts`
- `/Users/tony/Documents/Projects/Astria/lib/report-v2/section-signal-cards.ts`
- `/Users/tony/Documents/Projects/Astria/lib/report-v2/mode-section-cards.ts`
- `/Users/tony/Documents/Projects/Astria/lib/report-v2/model-profiles.ts`
- `/Users/tony/Documents/Projects/Astria/lib/report-v2/public-output.ts`
- `/Users/tony/Documents/Projects/Astria/app/api/reports/route.ts`
- `/Users/tony/Documents/Projects/Astria/app/api/admin/replay-report/route.ts`
- `/Users/tony/Documents/Projects/Astria/app/reports/ReportInboxClient.tsx`
- `/Users/tony/Documents/Projects/Astria/scripts/run-report-v2-model-profile-bakeoff.mts`
- `/Users/tony/Documents/Projects/Astria/scripts/run-report-v2-tier-dev-eval.mts`
- `/Users/tony/Documents/Projects/Astria/scripts/run-report-v2-mode-tier-eval.mts`
- `/Users/tony/Documents/Projects/Astria/scripts/run-report-v2-prompt-optimization-bakeoff.mts`
- `/Users/tony/Documents/Projects/Astria/scripts/check-report-v2-modes.mts`
- `/Users/tony/Documents/Projects/Astria/scripts/run-report-v2-anon-eval.mts`

## Comparison

| Feature | V1 working behavior | V2 before this pass | Action |
| --- | --- | --- | --- |
| Writer shape | Single Markdown writer call using structured section signal cards. | Single writer call, but prompt included a short deterministic baseline and thin instructions. | Removed deterministic baseline from prompt context; adapted v1 section signal cards and v1 prompt language. |
| Depth control | Prompt-driven: tier depth rules plus rich cards. Validation only enforces paid Identity floor. | Added blunt total deep-report and per-section word floors. | Removed invented total/per-section depth gates; kept v1-style paid Identity minimum. |
| Chart Evidence | Writer must not output Chart Evidence; app renders it deterministically. | Parser stripped evidence and validator no longer caught writer-supplied evidence. | Restored raw-output validation that rejects writer-supplied `**Chart Evidence**`. |
| Section cards | V1 cards include chart signals, capacities, risks, tensions, developmental tasks, and claim policy. | Missing; model saw summary facts and short deterministic copy. | Adapted cards into `packages/astrology` from current `ChartSignature`. |
| Section set | Identity, Core, Deep, Progressed, Synastry have distinct required sections. | Basic sets existed, with progressed/synastry thinner than v1. | Person Deep/Core/Identity aligned first; progressed/synastry still need fuller v1 quarry. |
| Validation | Bans JSON/debug fragments/stock phrases, checks required/forbidden sections, paid Identity floor, timing opener, Sun opening, unsupported claims. | Basic heading/fragment checks plus invented length rules. | Moved toward v1: headings, fragments, raw evidence ban, paid Identity floor. Unsupported-claim registry remains pending. |
| Model profiles | V1 has smoke, debug, debug_alt, production, premium_bakeoff with OpenRouter/OpenAI model mapping. | V2 had env-selected provider/model but not full profile matrix. | Added v1-style profile keys and a bakeoff runner; keep model-quality tuning paused for alpha unless a regression appears. |
| Admin/query tools | V1 has user report query, admin replay, debug/eval/bakeoff scripts, and library filters. | V2 had generation pipeline and smoke scripts, not the full v1 admin/query surface. | Added an internal admin replay route, bakeoff script, and basic list filters; admin-only UI/query parity remains the next alpha surface. |
| Rendering | V1 renders report chart, scaled chart, deterministic evidence disclosure, markdown export/copy/print/delete/share. | V2 lacked chart plate and evidence disclosure at first. | Chart plate, scaled report chart, gold headers, evidence disclosure, and affordances are now in v2 path. |

## Root Cause Of Short Tony Report

The live Tony Deep Sonnet report was short because v2 gave Sonnet a short deterministic report baseline as context and did not provide the v1-style section signal cards with capacities, risks, tensions, and developmental tasks. The model followed the short example instead of expanding from the same structured notes v1 used.

V1 did not rely on cajoling Sonnet with a total word-count validator. It gave the model a strong report job, rich section cards, and a validator that rejected invalid structure and weak paid Identity depth.

## Current Quarry Boundary

Directly quarried or adapted now:

- Single Markdown writer call.
- V1 section-card concept and public card block shape.
- V1 voice contract and section-level writing rules.
- Deterministic Chart Evidence contract.
- Paid Identity minimum instead of invented deep total minimum.
- Markdown-only model output.

Still pending:

- Full v1 `ChartFacts`/allowed-claims/evidence-completeness validation.
- Full mode section cards for relationship/synastry, progressed, and event reports.
- Admin-visible query/debug/bakeoff controls in the app UI.
- Full admin in-app query/debug/bakeoff forms beyond the current admin-visible replay endpoint and bakeoff command surface.
- Library query/filter behavior parity beyond the current short-list loading behavior.

## Rule Going Forward

For Astra report generation, chartmaking, chart scale-down, report evidence, model profiles, admin query, and library behavior: quarry v1 first. Add new code only where the clean v2 i18n/no-Supabase shell requires adaptation.

## 2026-06-23 Alpha Fence Addendum

Model quality tuning is set aside after the current Tony Sonnet and Haiku runs. The alpha priority is the report access fence:

- Persistent test user: `astra-report-parity@example.com`, promoted to admin with 31 Stars for comparison/report QA.
- Admin path: advanced report families plus internal replay/profile/bakeoff tools remain available behind admin/internal-token checks.
- Customer path: minimal report choices only, currently Identity and Core, with Stars required before creation.
- Current API behavior: non-admin Deep/Progressed/Synastry creation is rejected; minimal customer reports require enough Stars and debit the ledger after confirmed creation. Admin report creation records cost metadata but does not debit Stars.
