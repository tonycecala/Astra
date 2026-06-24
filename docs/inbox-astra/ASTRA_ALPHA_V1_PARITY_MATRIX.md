---
title: "Astra Alpha V1 Parity Matrix"
status: "active"
type: "quarry-matrix"
project: "Astra Job 1"
created: "2026-06-24"
scope: "alpha-critical v1 parity"
---

# Astra Alpha V1 Parity Matrix

V1 remains the source of truth for alpha-critical chart, report, Library, Stars, admin, and feedback behavior. V2 adapts only where Better Auth, Drizzle/Neon, i18n, or the no-Supabase boundary requires it.

## Alpha-Critical Surfaces

| Surface | V1 quarry sources | V2 status | Remaining rule |
| --- | --- | --- | --- |
| Birth data flow | `app/components/SubjectForm.tsx`, `lib/subject-form.ts`, `app/onboarding/OnboardingNameForm.tsx` | Restored as simple name -> birth details -> report -> review flow. | Do not add SaaS-style education steps. Improve date/time/place ergonomics only. |
| Chart home | `app/charts/page.tsx`, `app/reports/ReportChartPlate.tsx`, `lib/chartMath.ts` | `/charts` lists saved Self/Ally charts and opens full v1-style chart in place. | Keep under Self/Allies; no main-tab chart icon. |
| Report generation | `lib/report-v2/*`, `app/api/reports/route.ts`, report bakeoff scripts | Working OpenRouter/Sonnet pipeline with v1-style markdown writer, section cards, evidence, and model profiles. | Preserve single markdown writer shape; no invented parser formats or blunt length cajoling. |
| Report validation | `lib/report-v2/allowed-claims.ts`, `lib/report-v2/evidence-completeness.ts`, `lib/report-v2/validate-report-v2-markdown.ts` | V2 has raw evidence ban, required headings, forbidden fragments, v1-style allowed-claim validation, and deterministic evidence completeness checks. | Continue tightening only from v1 validation code when a real report QA case exposes a gap. |
| Library list/detail | `app/reports/ReportInboxClient.tsx`, `app/reports/report-library-client.ts` | V2 has lightweight list filters/search and v1-style detail with chart plate and actions. | List stays header/metadata only; detail owns heavy report. |
| Report actions | `app/reports/[id]/ReportActions`, `app/reports/ReportMarkdown.tsx` | Share, revoke, copy link, download markdown, copy markdown, print, delete are present. | Keep actions private/report-owned and browser-visible. |
| Report feedback | `app/reports/ReportFeedbackForm.tsx`, `app/api/beta-feedback/route.ts`, `lib/server/beta-feedback-store.ts` | Ported to Drizzle feedback table/API/form/admin inbox. | Store only alpha QA feedback; no broad activity system until needed. |
| Stars/ledger | `app/credits/*`, `lib/server/credit-store.ts`, `lib/credit-config.ts` | V2 has Star packs, Stripe checkout, webhook fulfillment, ledger, admin adjustments, spend records. | Ledger is source of truth; profile balance mirrors ledger. |
| Admin report QA | `app/admin/page.tsx`, `app/api/admin/replay-report/route.ts`, `scripts/run-report-v2-*-bakeoff.mts` | V2 has user search, ledger, role, report request selector, selected-run inspector, replay, model profile/provider/model controls, recent reports, Library links, validation errors, provenance, and usage placeholders. | Add only further v1 query/debug controls when they directly help alpha report QA. |

## Post-Alpha V1 Surfaces

These are intentionally not alpha blockers:

- Full invites/growth flows.
- Full settings/notifications center.
- Gallery/sample/public-figure expansion.
- Deeper gifts productization.
- Legacy route aliases beyond current alpha routes.

## Acceptance Gate

Alpha parity is complete when an admin can create and inspect Self, Ally, Identity, Core, Deep, Progressed, and Synastry reports; a customer sees only paid alpha-safe choices with confirmation; Library renders v1-quality reports; Stars checkout/webhook/ledger balances agree; and report feedback reaches the admin inbox.
