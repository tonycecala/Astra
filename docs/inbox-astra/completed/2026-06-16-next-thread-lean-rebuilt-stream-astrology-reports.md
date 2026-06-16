---
title: "Next thread handoff: lean rebuilt stream and astrology reports"
status: "acted"
created: "2026-06-16"
date: "2026-06-16"
updated: "2026-06-16"
priority: "high"
type: "handoff"
from: "/Users/tony/Documents/Projects/Astra"
to: "/Users/tony/Documents/Projects/Astra"
tags: ["agent-message", "handoff", "fresh-thread", "astra", "stream", "astrology-reports", "lean-modular", "high"]
related: ["../../../akashic/missions/2026-06-12-astra-clean-start-foundation-progress.md", "../../architecture/clean-start-foundation.md", "../../../akashic/agent-inbox/2026-06-15-fresh-thread-astra-foundation-next-step.md"]
---

# Next Thread Handoff: Lean Rebuilt Stream and Astrology Reports

## Start Here

This handoff bridges the current merged foundation into the next ten implementation steps toward Astra as a lean, modular, non-Supabase web app where astrology is a module and the stream/report experience is the product surface.

Begin the next thread by creating a fresh branch from `main`, then run:

```bash
ak governance check
git status --short --branch
npm run dev:status
```

Read these first:

- `akashic/missions/2026-06-12-astra-clean-start-foundation-progress.md`
- `docs/architecture/clean-start-foundation.md`
- `akashic/agent-inbox/2026-06-15-fresh-thread-astra-foundation-next-step.md`

## Current State

- `main` now includes the local DB, Better Auth email-code login, Mailpit auth-code smoke, chart request/result persistence, Composer stream artifact publishing, Astra stream ingestion, native timezone picker, and no-Supabase boundary checks.
- `/self` is an authenticated profile and birth-data onboarding route. It now queues linked chart/private report requests after review, supports provider-backed local place search, and exposes a private user-owned Generate action for queued reports.
- `/journey` renders DB-backed Composer stream items.
- `@astra/chart-maker` is an independent module boundary that accepts `ChartMakerRequest` and returns typed chart-maker results. It is still deterministic contract behavior, not the final ephemeris-backed astrology engine.
- Composer has a voice registry and publishes typed stream artifacts. Astra ingests those artifacts through an API contract rather than app-to-app imports.
- The current local internal token rule is fail-hard: missing or wrong `ASTRA_INTERNAL_API_TOKEN` must produce an explicit failure, not a silent substitute.

## Architecture Laws To Preserve

- Astra renders.
- Composer composes.
- Modules compute.
- Contracts define.
- The database persists quietly.
- UI handles speak through i18n.
- No Supabase packages, imports, env vars, RLS assumptions, compatibility shims, or runtime DDL.
- No hidden fallbacks. If a required service, token, engine, or origin is unavailable, fail clearly at the boundary.
- Keep the system light, lean, and modular. Delete stale paths after pivots instead of carrying compatibility code.

## Next 10 Steps

1. **Start clean and verify the baseline.** Create a new `codex/` branch from `main`, run governance, inspect inbox/warnings/status, confirm the dev server, and rerun the narrow foundation smokes before editing.

2. **Define the astrology report contract.** Add typed contracts for report requests, report results, report sections, provenance, status, and private/public boundaries. Keep the contract small enough that Composer can consume signals without hauling raw engine payloads through the app.

3. **Replace the `/self` chart smoke with multi-step birth-data onboarding.** Birth date is the absolute minimum. Birth time, timezone, and birth location are one optional precision bundle. Question, intent, and context remain optional. Use native/selectable timezone UX, city/place search when provider-backed, and a final review step before submission.

4. **Install the real astrology module boundary.** Evolve `packages/chart-maker` and/or `packages/astrology` so the app talks to a stable interface. The first implementation may be adapter-shaped, but it must fail when the configured ephemeris engine is absent rather than pretending to generate production astrology.

5. **Persist the report lifecycle.** Add Drizzle schema/migrations for report requests/results or report artifacts, with user ownership, status, engine/version metadata, request normalization, timestamps, and future room for credits/cost tracking.

6. **Create the report generation API path.** Add authenticated request creation, an internal result/write endpoint protected by `ASTRA_INTERNAL_API_TOKEN`, and narrow API smokes that prove success, unauthorized, and missing-token cases.

7. **Connect report outputs to Composer cleanly.** Composer should consume typed chart/report signals and produce stream artifacts with rationale, tone/voice metadata, and durable IDs. Keep Composer independent; no direct imports from Astra app code.

8. **Retool the stream as the primary product surface.** Make `/journey` feel like the working app: DB-backed lanes/cards, clear card detail, report-linked stream items, save/reflect actions where useful, and i18n-backed loading/empty/error states. Avoid marketing-page drift.

9. **Design the production private feed read model and caching boundary.** Composer should produce user-owned feed projections from source material, private state, timing, progress, and explicit permissions. Public/shared stream data is fallback/source-layer only. Private reports stay auth-gated and user-owned. Define user-scoped cache tags/invalidation before adding more derived stream data.

10. **Verify, capture, merge, and branch again.** Run lint, typecheck, no-Supabase/boundary checks, affected unit/API smokes, build, and browser QA for desktop/tablet/mobile. Update the mission doc, capture any Akashic lessons, merge the branch, then start the next branch intentionally.

## Likely Blockers

- Decide whether the migrated `circular-natal-horoscope-js` adapter is production v1 or should remain a local proof behind a later production provider.
- Choose the production geocoding/timezone provider for birth place lookup.
- Decide the first report product: core self report, chart interpretation report, daily/stream report, or question/intention report.
- Define the permissioned boundary split for stream cards derived from personal reports, then project them into user-owned feed rows rather than a global public stream.
- Define cache invalidation before edge caching Composer/read-model data.
- Decide when credits/payments enter the lifecycle if report generation has provider cost.

## First Review Question For Tony

Pick the next implementation slice:

- **Onboarding first:** turn `/self` into the multi-step birth-data intake.
- **Contracts first:** define report contracts, persistence, and API smokes.
- **Stream first:** retune `/journey` around DB-backed stream cards and report placeholders.

Recommended next slice: **Contracts first**, because it fixes the shape of stream, reports, persistence, and module boundaries before UI complexity grows.

## Progress Note

2026-06-16: Contracts-first slice is underway on `codex/astra-report-contracts`. Completed report contracts, Drizzle persistence, authenticated `/api/reports`, token-guarded `/api/report-results`, fail-hard `@astra/astrology` engine-unavailable adapter, Composer report-signal publisher, `/self` report lifecycle status, `/journey` report-signal status, generated/applied migration `0002_large_black_tom`, and `npm run test:report-api`. Also replaced the single `/self` chart-smoke form with `BirthOnboardingPanel`, a multi-step subject/date/precision/intent/review flow that queues linked chart and private report requests. Keep this handoff active because the broader ten-step plan still needs provider-backed place search, real ephemeris/report engine selection, production private feed/read-model design, and deeper stream product work.

2026-06-16: Stream/read-model slice added report-signal ingestion proof and `/journey` product-surface metadata. Composer report signals now publish as `artifact` stream items in the transitional schema; `npm run test:composer-ingest-api` proves generic Composer card plus report-signal card ingestion and `/journey` rendering. `/journey` now shows item kind/status/audience/date metadata plus explicit loading/error states. `docs/architecture/stream-read-model-cache-boundary.md` has since been corrected to require private user feed projections and user-scoped cache semantics. Remaining large blockers: provider-backed place search, real ephemeris/report engine selection/configuration, and the private personal feed contract/schema split.

2026-06-16: Birth-place provider boundary added. Shared contracts now define typed place search results; `@astra/astrology` owns `searchBirthPlaces`; `/api/places/search` is authenticated and fails clearly when no provider is configured. Local verification uses non-secret `ASTRA_PLACE_SEARCH_PROVIDER=local-fixture`; `BirthOnboardingPanel` can search/select a place, fill timezone and coordinates, and keep manual confirmation editable. `npm run test:place-search-api` and the signed-in `/self` E2E cover this path. Final browser QA also proved `/self` at desktop/tablet/phone with New York place selection, linked chart/report queueing, no console errors, and no horizontal overflow.

2026-06-16: First configured report engine slice added. `@astra/astrology` now supports `ASTRA_EPHEMERIS_ENGINE=local-chart-routine` through the migrated `circular-natal-horoscope-js` routine from Astria, preserving tropical + Whole Sign chart signatures before emitting completed private report sections/provenance plus a Composer-safe public signal. `npm run test:astrology-engine` proves both unconfigured fail-clear behavior and configured local-engine completion; `npm run test:report-api` now proves completed result recording and public-signal preservation. Remaining product decision: confirm whether this local adapter is production v1 or should be replaced behind the same boundary.

2026-06-16: User-visible report generation slice added. `/api/reports/[requestId]/generate` lets a signed-in user generate only their own queued report with the configured engine, records the result through the same Drizzle transaction, and returns the updated request/result. `/self` now shows Generate on queued reports and updates to completed status plus the public-signal headline after generation. `npm run test:report-api` covers user-owned generation; the signed-in `/self` Playwright journey clicks Generate and asserts completed/Gemini output; in-app browser QA verified desktop/tablet/phone `/self` completed status with no new console errors or horizontal overflow.

2026-06-16: Private report reader slice added. `/self` now lets the signed-in user open generated report detail in-place, showing private sections such as `Core pattern` and report provenance while keeping only the explicit boundary signal available for Composer feed projection. The signed-in `/self` E2E now clicks `Read report` and asserts private reader content; in-app browser QA verified desktop/tablet/phone private report detail with no new console errors or horizontal overflow.

2026-06-16: Library artifact slice added. Completed report generation now upserts a deterministic user-owned `report:<requestId>` artifact, and `/library` switches to signed-in private artifacts instead of the public foundation snapshot. Older completed report results without artifact rows are merged into the signed-in library view as report artifacts so existing local generations stay visible. The signed-in `/self` E2E now verifies the generated report appears in `/library`; browser QA verified signed-in `/library` report artifacts on desktop/tablet/phone with no console errors or horizontal overflow.

2026-06-16: Explicit signal publish slice added. `/api/reports/[requestId]/publish-signal` authorizes the signed-in owner, requires a completed report result with `publicSignal`, and upserts only the Composer-shaped artifact into the current transitional `/journey` stream. `/self` exposes this as `Publish signal` in the private report reader. `npm run test:report-api` covers the route, the signed-in `/self` E2E verifies the card appears in `/journey`, and in-app browser QA verified desktop/tablet/phone `/journey` report-signal rendering with no console errors or horizontal overflow. This must evolve to user-owned feed projection, not global public broadcast.

2026-06-16: Non-LLM report writer boundary added. `@astra/astrology` now separates `ASTRA_EPHEMERIS_ENGINE=local-chart-routine` from `ASTRA_REPORT_WRITER=local-deterministic-writer`; the deterministic writer emits richer private sections, writer provenance, and a Composer-safe public signal without an LLM call, paid provider, or credit spend. Unsupported writer names fail closed, so the future lower-debug model-backed writer can be added deliberately behind the same switch.

2026-06-16: Handoff acted. `codex/astra-report-contracts` was validated, committed as `9d94767`, fast-forward merged into `main`, and the fresh follow-up branch `codex/astra-next-stream-cache-review` was started from merged `main`. Remaining items are product/provider decisions, not unfinished mechanics in this handoff: production birth-place provider, whether the migrated local chart routine is production v1, report product packaging, credits timing, and deployment-time cache/invalidation implementation.
