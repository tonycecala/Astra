---
title: "Next thread handoff: lean rebuilt stream and astrology reports"
status: "active"
created: "2026-06-16"
date: "2026-06-16"
updated: "2026-06-16"
priority: "high"
type: "handoff"
from: "/Users/tony/Documents/Projects/Astra"
to: "/Users/tony/Documents/Projects/Astra"
tags: ["agent-message", "handoff", "fresh-thread", "astra", "stream", "astrology-reports", "lean-modular", "high"]
related: ["../missions/2026-06-12-astra-clean-start-foundation-progress.md", "../../docs/architecture/clean-start-foundation.md", "2026-06-15-fresh-thread-astra-foundation-next-step.md"]
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
- `/self` is an authenticated foundation route with profile and chart-request smoke behavior. It is not the final onboarding surface.
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

9. **Design the production read model and caching boundary.** Composer/public/read-model data can move toward edge-first caching, but origin failure must be explicit. Private reports stay auth-gated and user-owned. Define cache tags/invalidation before adding more derived stream data.

10. **Verify, capture, merge, and branch again.** Run lint, typecheck, no-Supabase/boundary checks, affected unit/API smokes, build, and browser QA for desktop/tablet/mobile. Update the mission doc, capture any Akashic lessons, merge the branch, then start the next branch intentionally.

## Likely Blockers

- Choose the ephemeris/chart engine or approve an interface-first slice with explicit not-configured failure.
- Choose the geocoding/timezone provider for birth place lookup.
- Decide the first report product: core self report, chart interpretation report, daily/stream report, or question/intention report.
- Define the private/public split for stream cards derived from personal reports.
- Define cache invalidation before edge caching Composer/read-model data.
- Decide when credits/payments enter the lifecycle if report generation has provider cost.

## First Review Question For Tony

Pick the next implementation slice:

- **Onboarding first:** turn `/self` into the multi-step birth-data intake.
- **Contracts first:** define report contracts, persistence, and API smokes.
- **Stream first:** retune `/journey` around DB-backed stream cards and report placeholders.

Recommended next slice: **Contracts first**, because it fixes the shape of stream, reports, persistence, and module boundaries before UI complexity grows.
