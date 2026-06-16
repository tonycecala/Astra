---
title: "Astra Progress Log"
type: "repo-progress-log"
status: "active"
scope: "Astra"
created: "2026-06-16"
owner: "Tony"
repo: "Astra"
summary: "Durable session-by-session memory for Astra repo work."
---

# Astra Progress Log

## Entries

### 2026-06-16 - Composer Onboarding Cards

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** Composer onboarding private-feed implementation
**Status:** complete

#### What Changed

- Added a Composer onboarding batch contract and `POST /api/composer/onboarding-cards` behind the internal API token.
- Added Composer-side onboarding card preparation from the working Astria onboarding set, projected as user-owned private Journey cards through the existing private-feed write contract.
- Replaced signed-out `/journey` sample data with a 12-card subset from Astria's 200 published Composer public cards and capped anonymous Journey to the current public preview.
- Kept signed-in first-run Journey private and empty until Composer publishes onboarding cards; no public preview cards are copied into private feeds.
- Added mobile-first Composer onboarding smokes using Mailpit, real auth, the trusted API route, privacy checks, console/page-error checks, and horizontal-overflow checks.

#### Tests Run

- `npm run check`
- `npm run test:e2e`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-onboarding-cards`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-onboarding-mobile`
- Mobile route proof uses Playwright as the durable evidence per Akashic guidance; in-app browser was used only as a light visual sanity check.

#### Risks / Follow-ups

- Composer onboarding is still a deterministic workflow/helper plus trusted API route, not a rendered operator UI. Add visible Composer controls only when human editing of onboarding cards is needed.

### 2026-06-16 - Chart Generation Flow UX

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** chart/report generation UX
**Status:** complete

#### What Changed

- Added a compact chart generation flow map to `/self`: birth data -> chart queued -> report generated -> saved in Library.
- Moved generated report reading into a simple private report card with a Library link and publish-signal action.
- Made Library handoff explicit in `/self`; completed reports continue to persist as `report:<requestId>` artifacts.
- Kept automatic testing on the local deterministic writer and preserved the later alpha seam for chosen LLM writers.
- Used Mobbin pattern references for staged generation/status and compact result review, then chose a simpler card treatment for mobile-first alpha usability.
- Reverted the birth-date field to plain `YYYY-MM-DD` text input after rendered browser QA exposed native date-input state friction.

#### Tests Run

- `ak governance check`
- `npm run lint`
- `npm run typecheck`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:chart-request-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:report-api`
- `npm run test:place-search-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npx playwright test --config apps/astra-web/playwright.config.ts --project=desktop -g "signed-in self onboarding queues chart and report requests"`
- `npm run check`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:e2e`
- In-app browser `/self` chart flow QA through report generation, report card, Library route, tablet, and mobile with no horizontal overflow and no console error logs.

#### Risks / Follow-ups

- The report writer remains deterministic/local for automatic testing. Alpha can choose LLM writers later behind the existing writer boundary.
- The report card is intentionally scoped to private report detail; Composer still controls publishing user-owned Journey cards from explicit report signals.

### 2026-06-16 - Auth and Self Onboarding Alpha

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** auth/onboarding alpha hardening
**Status:** complete

#### What Changed

- Made the signed-in email-code panel actionable with direct `Continue to Self` and `Open Journey` actions.
- Simplified `/self` first-run report setup copy around the alpha path: subject and birth date are enough; time and place are optional precision.
- Added visible onboarding progress and date-only guidance while keeping the private chart/report request contract unchanged.
- Updated auth-related smokes to require Mailpit for OTP retrieval instead of falling back to file-captured email.

#### Tests Run

- `ak governance check`
- `npm run dev:status`
- `npm run test:auth-code`
- `npm run test:place-search-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:chart-request-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:report-api`
- `npm run check`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:e2e`
- In-app browser `/login` -> Mailpit OTP -> `/self` reload QA at desktop, plus `/self` tablet/mobile responsive checks with no horizontal overflow and no console error logs.

#### Risks / Follow-ups

- Production-like local smokes require `ASTRA_INTERNAL_API_TOKEN` in the shell environment when exercising trusted internal result APIs.
- The alpha path is now ready for LLM writer selection later; local deterministic writer remains the automatic testing route.

### 2026-06-16 - Journey Core Product Loop

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** core Journey loop
**Status:** complete

#### What Changed

- Made `/journey` explicit about signed-out public preview, signed-in first-run private empty state, and signed-in private ready state.
- Removed automatic copying of public fallback cards into signed-in private feeds.
- Clarified that Composer generates the first onboarding cards and remains the default private feed creation path.

#### Tests Run

- `npm run check`
- `npm run test:composer-operator-workflow`
- `npm run test:e2e`
- In-app browser `/journey` QA for signed-out public preview, first-run signed-in private empty state, and Composer-published signed-in private ready state at desktop/tablet/mobile.

#### Risks / Follow-ups

- Composer onboarding card generation is the intended product path; this slice only prevents Astra from substituting public fallback cards as private feed content.

### 2026-06-16 - Composer Operator Review Workflow

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** composer operator workflow
**Status:** complete

#### What Changed

- Added the first Composer-owned operator workflow for source-card draft -> preview -> target user -> private feed publish.
- Kept Composer independent from Astra internals by emitting `ComposerPrivateFeedWrite` through the existing trusted API contract.
- Added a deterministic operator draft fixture and validation for source cards, voice cards, explicit target user, preview payload, and decision trace.
- Added a smoke that proves repeat publish/idempotency, User A/User B ownership isolation, signed-out public fallback privacy, and signed-in `/journey` visibility.
- Fixed a tablet-width horizontal overflow found during rendered `/journey` QA.

#### Tests Run

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run build`
- `npm run check`
- `npm run test:private-feed`
- `npm run test:composer-private-feed-api`
- `npm run test:composer-operator-workflow`
- `npm run test:e2e`
- In-app browser `/journey` QA at desktop/tablet/mobile with the operator QA card visible, no console errors, and no horizontal overflow.

#### Risks / Follow-ups

- Composer is still a library/operator workflow surface, not a visible admin UI. Add a rendered Composer route only when the operator tool needs human editing controls beyond deterministic draft/review helpers.

### 2026-06-16 - Composer Private Feed Write Edge

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** private-feed implementation
**Status:** complete

#### What Changed

- Added `ComposerPrivateFeedWrite` as the trusted Composer-to-Astra private Journey write contract.
- Added `POST /api/composer/private-feed-items` behind `x-astra-internal-token`.
- Added Composer-side private feed publisher helpers and a live API smoke.
- Routed signed-in report signal publishing through the private-feed contract/service instead of a direct feed write.

#### Tests Run

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run check:boundaries`
- `npm run test:composer-private-feed-api`
- `npm run test:private-feed`
- `npm run test:composer-ingest-api`
- `npm run test:report-api`

#### Risks / Follow-ups

- Build out Composer operator/review UI on top of the private write edge.
- Retain `/api/composer/stream-artifacts` only for public fallback/source-layer content until it can be retired or clearly scoped.

### 2026-06-16 - Stewardship v3 Install

**Report Level:** 3 - Workflow & QA View  
**Actor:** Codex  
**Session Type:** docs/governance setup  
**Status:** complete

#### What Changed

- Installed local Stewardship v3 pointer docs and reporting-level defaults.
- Captured initial system map, boundaries, risk register, and review checklist from repo evidence.
- Added first Steward review follow-up task.

#### Tests Run

- `ak governance check`

#### Risks / Follow-ups

- First formal Steward review task created and acknowledged.
- Run a formal Steward review of private feed, report generation, and Composer boundaries.
