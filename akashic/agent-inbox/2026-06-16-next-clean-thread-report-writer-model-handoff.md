---
title: "Next clean thread handoff: report writer model route"
status: "acknowledged"
created: "2026-06-16"
date: "2026-06-16"
updated: "2026-06-16"
priority: "high"
type: "handoff"
from: "/Users/tony/Documents/Projects/Astra"
to: "/Users/tony/Documents/Projects/Astra"
tags: ["agent-message", "handoff", "fresh-thread", "astra", "report-writer", "model-route", "high"]
related: ["../missions/2026-06-12-astra-clean-start-foundation-progress.md", "../../docs/architecture/clean-start-foundation.md", "../../docs/architecture/stream-read-model-cache-boundary.md", "2026-06-16-next-thread-lean-rebuilt-stream-astrology-reports.md"]
---

# Next Clean Thread Handoff: Report Writer Model Route

## Start Here

After `codex/astra-next-stream-cache-review` is reviewed and merged, start the next thread from a fresh `codex/` branch off `main`.

Run this before editing:

```bash
ak governance check
git status --short --branch
npm run dev:status
```

Then read, in order:

- `AGENTS.md`
- `akashic/repomaps/current.md`
- `akashic/missions/2026-06-12-astra-clean-start-foundation-progress.md`
- `docs/architecture/clean-start-foundation.md`
- `docs/architecture/stream-read-model-cache-boundary.md`

Use REPOMAP first. Use JCodeMunch for symbol-level navigation when code ownership is unclear. Use `astra-browser-qa` for any UI, route, auth, report, public/private, credits, or journey change.

## Current Branch State

Current branch: `codex/astra-next-stream-cache-review`.

Recent commits:

- `5cc6d20 Use migrated chart routine for report signatures`
- `bd44861 Add deterministic report writer boundary`

Do not assume `main` contains these until the branch is merged.

## What Is Proven

- `@astra/astrology` uses the migrated Astria routine `circular-natal-horoscope-js`.
- Defaults are tropical zodiac and Whole Sign houses.
- Tony fixture now yields `Gemini Sun, Virgo Moon, Cancer rising`.
- Astria public AA Einstein fixture yields `Pisces Sun, Sagittarius Moon, Cancer rising`.
- `ASTRA_EPHEMERIS_ENGINE=local-chart-routine` computes chart signatures.
- `ASTRA_REPORT_WRITER=local-deterministic-writer` writes the first report draft without LLM calls, paid providers, or credit spend.
- Unsupported writer names fail closed before any model-backed route can run.
- `/self` can queue, generate, read, and publish a private report/public signal.
- `/journey` receives only the explicit public signal; private report sections and writer handoff text stay out of the public stream.
- Desktop/tablet/mobile browser QA proved `/self` and `/journey` have no console errors or horizontal overflow after the latest report-writer work.
- Active nav indicators now work on desktop list and mobile bottom tabs.

## Commands Last Passed

```bash
set -a; source apps/astra-web/.env.local; set +a; npm run test:astrology-engine && npm run test:report-api
npm run check
set -a; source apps/astra-web/.env.local; set +a; npm run test:place-search-api && npm run test:composer-ingest-api && npm run test:e2e
ak governance check
ak repomap build
```

`npm run test:e2e` result: 46 passed, 2 expected skips.

## User-Visible Browser Proof

In the current local database, the latest fresh browser-generated sample is `Astra Writer Smoke`.

Review path:

1. Open `http://localhost:3011/self`.
2. Open/read `Astra Writer Smoke`.
3. Confirm private report text includes `Writer handoff`.
4. Confirm private report text includes `no LLM call, no paid provider, no credit spend`.
5. Open `http://localhost:3011/journey`.
6. Confirm the public report signal appears, but the private writer handoff text does not.

Old visible rows with incorrect historical signatures are expected local history and should not be treated as current failures.

## Next Logical Slice

Add the first lower-debug model-backed writer behind the existing `ASTRA_REPORT_WRITER` boundary.

Recommended shape:

- Keep `local-deterministic-writer` as the baseline and regression oracle.
- Add a new explicit writer key, for example `debug-model-writer`, without changing chart calculation.
- Use public/synthetic fixtures first: Tony local test fixture and Astria public AA fixture.
- Keep private chart data out of free/shared providers.
- Record model/provider/debug-level provenance in private report provenance.
- Preserve the public/private split: Composer gets only `AstrologyReportPublicSignal`.
- Add fail-closed config behavior for missing model provider/API key.
- Add smokes that compare model-backed output against the deterministic chart signature, not against old historical rows.
- Only introduce credits/payment once provider cost is intentionally enabled.

## Model Notes From Latest Check

OpenAI official docs currently position `gpt-5.5` as the flagship model, with `gpt-5.4`, `gpt-5.4-mini`, and `gpt-5.4-nano` as lower-cost/lower-latency options. For the first debug writer, prefer the cheapest official low-debug route that can keep private data under our account controls.

OpenRouter free models can be useful for public/synthetic comparison only. Their providers may log prompts, so do not send private chart data there.

## Guardrails

- No Supabase carryover.
- No hidden fallbacks.
- No model call unless the writer route is explicitly configured.
- No paid/credit side effect until the credit lifecycle is deliberately added.
- No hardcoded UI chrome outside i18n.
- Do not treat lint/build alone as completion. Use browser-visible QA for report/journey work.

## Recommended First Review Step For Tony

After the next branch starts, first refresh `/self`, open `Astra Writer Smoke`, and confirm the deterministic writer baseline. Then implement the model-backed writer behind the switch and compare against that baseline.
