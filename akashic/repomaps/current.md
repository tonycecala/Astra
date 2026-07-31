---
title: "Current REPOMAP"
type: "repomap"
description: "Current repository map for agent onboarding and code navigation."
status: "current"
project: "akashic"
date: "2026-07-31"
created: "2026-07-31"
updated: "2026-07-31"
timestamp: "2026-07-31"
okf_version: "0.1"
tags: ["repomap", "onboarding"]
related: []
---

# REPOMAP

## Purpose
This repository contains `astra-clean-start`. No package description found.

## Version
- REPOMAP version: `2.0.0`
- Generator: `ak`
- Machine manifest: `akashic/repomaps/current.json`
- Meta index: `akashic/repomaps/meta.json`
- Estimated token footprint: `1173360`

## Architecture
- `akashic/` contains durable engineering knowledge artifacts.
- Package scripts expose: `alpha:promote-admin`, `alpha:verify-report-continuity`, `build`, `check`, `check:alpha-env`, `check:boundaries`, `check:composer-alpha-env`, `check:fast`, `check:i18n`, `check:no-supabase`, `composer:dev`, `composer:logs`, `composer:restart`, `composer:status`, `composer:stop`, `composer:up`, `data:export-user`, `data:import-user`, `data:repair-birth-places`, `data:repair-imported-allies`, `db:generate`, `db:migrate`, `db:reset:local`, `db:seed`, `db:seed:private-card`, `dev`, `dev:restart`, `dev:status`, `dev:stop`, `dev:up`, `lint`, `overview:chart-flow`, `overview:light`, `report:ally-deep-bakeoff`, `report:audit-deep-cohort`, `report:bakeoff`, `report:compare-deep`, `report:prompt-bakeoff`, `report:prompt-compare`, `report:quality-bakeoff`, `report:relationship-context-bakeoff`, `report:semantic-synthesis-control`, `report:semantic-synthesis-v2-phase-5`, `report:semantic-synthesis-v2-phase-6`, `start`, `stripe:fulfill-latest`, `test`, `test:ally-api`, `test:ally-tone-routing`, `test:astrology-engine`, `test:astrology-public-api`, `test:auth-code`, `test:auth-profile-concurrency`, `test:birth-date-time-sheet`, `test:chart-boundary`, `test:chart-maker`, `test:chart-request-api`, `test:composer-availability-api`, `test:composer-card-detail`, `test:composer-card-queue-api`, `test:composer-course-ux`, `test:composer-hosted-boundary`, `test:composer-ingest-api`, `test:composer-onboarding-cards`, `test:composer-onboarding-mobile`, `test:composer-operator-workflow`, `test:composer-private-feed-api`, `test:composer-public-preview`, `test:composer-quarry`, `test:composer-selection-api`, `test:composer-stream`, `test:e2e`, `test:e2e:all`, `test:e2e:auth`, `test:e2e:journey`, `test:e2e:rate-limit`, `test:e2e:release`, `test:e2e:report`, `test:e2e:responsive`, `test:e2e:smoke`, `test:email-config`, `test:journey-curation`, `test:place-search-api`, `test:place-search-provider`, `test:private-feed`, `test:report-api`, `test:report-basis-contracts`, `test:report-deep-presentation`, `test:report-deep-quality`, `test:report-display-title`, `test:report-families`, `test:report-model-strategy`, `test:report-paragraphs`, `test:report-rule-catalog`, `test:report-settings-quality`, `test:semantic-synthesis-v2-phase-1`, `test:semantic-synthesis-v2-phase-2`, `test:semantic-synthesis-v2-phase-3`, `test:semantic-synthesis-v2-phase-4`, `test:semantic-synthesis-v2-phase-5`, `test:semantic-synthesis-v2-phase-6`, `test:stripe-checkout`, `test:stripe-webhook`, `test:synastry-v3-engine`, `test:synastry-v3-packet`, `test:synastry-v3-validation`, `test:tony-deep-sonnet`, `test:user-data-portability`, `typecheck`.

## Directory Structure
```txt
.codex/
AGENTS.md
ASTRA_CLEAN_START_INAUGURAL_CHARTER.md
PROJECT.md
README.md
akashic/
apps/
docs/
eslint.config.mjs
package-lock.json
package.json
packages/
scripts/
tsconfig.base.json
tsconfig.json
```

## Major Systems
- `akashic/agent-inbox` knowledge artifacts
- `akashic/decisions` knowledge artifacts
- `akashic/imports` knowledge artifacts
- `akashic/mail` knowledge artifacts
- `akashic/missions` knowledge artifacts
- `akashic/playbooks` knowledge artifacts
- `akashic/skills` knowledge artifacts
- `akashic/templates` knowledge artifacts
- `akashic/warnings` knowledge artifacts

## Entry Points
- `apps/astra-web/app/api/reports/route.ts` - 2 route handler(s), 2 export(s), 42 symbol(s), 7 import(s), ~2151 tokens
- `apps/composer-web/app/api/cards/queue-draft/route.ts` - 3 route handler(s), 3 export(s), 22 symbol(s), 4 import(s), ~679 tokens
- `apps/astra-web/app/api/reports/[requestId]/share/route.ts` - 2 route handler(s), 2 export(s), 10 symbol(s), 3 import(s), ~372 tokens
- `apps/composer-web/app/api/cards/publish-plan/route.ts` - 2 route handler(s), 2 export(s), 10 symbol(s), 2 import(s), ~306 tokens
- `apps/astra-web/app/api/allies/[allyId]/route.ts` - 2 route handler(s), 2 export(s), 9 symbol(s), 4 import(s), ~397 tokens
- `apps/astra-web/app/api/chart-requests/route.ts` - 2 route handler(s), 2 export(s), 8 symbol(s), 4 import(s), ~385 tokens
- `apps/astra-web/app/api/allies/route.ts` - 2 route handler(s), 2 export(s), 8 symbol(s), 4 import(s), ~299 tokens
- `apps/astra-web/app/api/stripe/webhook/route.ts` - 1 route handler(s), 2 export(s), 20 symbol(s), 4 import(s), ~790 tokens
- `apps/composer-web/app/api/library/availability/route.ts` - 1 route handler(s), 1 export(s), 16 symbol(s), 4 import(s), ~635 tokens
- `apps/composer-web/app/api/chart-arrival/rewrite/route.ts` - 1 route handler(s), 1 export(s), 15 symbol(s), 3 import(s), ~618 tokens
- `apps/astra-web/app/api/composer/selection/route.ts` - 1 route handler(s), 1 export(s), 12 symbol(s), 3 import(s), ~665 tokens
- `apps/composer-web/app/api/cards/prepare-batch/route.ts` - 1 route handler(s), 1 export(s), 12 symbol(s), 5 import(s), ~639 tokens
- `apps/astra-web/app/api/admin/replay-report/route.ts` - 1 route handler(s), 1 export(s), 12 symbol(s), 5 import(s), ~723 tokens
- `apps/composer-web/app/api/cards/query/route.ts` - 1 route handler(s), 1 export(s), 10 symbol(s), 2 import(s), ~349 tokens
- `apps/astra-web/app/api/billing/create-checkout-session/route.ts` - 1 route handler(s), 2 export(s), 13 symbol(s), 4 import(s), ~709 tokens
- `apps/astra-web/app/api/reports/[requestId]/generate/route.ts` - 1 route handler(s), 1 export(s), 10 symbol(s), 6 import(s), ~526 tokens
- `apps/composer-web/app/api/cards/publish-batch/route.ts` - 1 route handler(s), 1 export(s), 9 symbol(s), 4 import(s), ~515 tokens
- `apps/composer-web/app/api/cards/publish/route.ts` - 1 route handler(s), 1 export(s), 8 symbol(s), 4 import(s), ~420 tokens
- `apps/astra-web/app/api/places/search/route.ts` - 1 route handler(s), 1 export(s), 6 symbol(s), 4 import(s), ~356 tokens
- `apps/astra-web/app/api/beta-feedback/route.ts` - 1 route handler(s), 1 export(s), 7 symbol(s), 4 import(s), ~386 tokens

## External Integrations
- Auth provider/library
- Drizzle
- Next.js
- OpenAI
- Postgres
- React

## Data Flow
1. Source files define local behavior.
2. Package scripts provide build/test/runtime entry points where available.
3. Akashic artifacts preserve durable repo knowledge.

## Critical Files
- `packages/astrology/src/index.ts` - weight 2831.11, ~45687 tokens, 662 symbols, in:0/out:16
- `packages/db/src/repositories.ts` - weight 1069.18, ~19895 tokens, 225 symbols, in:1/out:2
- `packages/astrology/src/meaningComplexNetwork.ts` - weight 918.2, ~15519 tokens, 233 symbols, in:1/out:0
- `packages/astrology/src/structuralChartFacts.ts` - weight 798.22, ~12000 tokens, 206 symbols, in:1/out:0
- `apps/composer-web/lib/cardLibrary.ts` - weight 585.24, ~8636 tokens, 135 symbols, in:16/out:13
- `packages/contracts/src/index.ts` - weight 578.22, ~11401 tokens, 210 symbols, in:0/out:0
- `apps/astra-web/components/BirthOnboardingPanel.tsx` - weight 553.21, ~13463 tokens, 123 symbols, in:2/out:5
- `apps/astra-web/app/admin/page.tsx` - weight 481.22, ~11135 tokens, 100 symbols, in:0/out:2
- `apps/composer-web/components/CardWorkspace.tsx` - weight 457.24, ~9273 tokens, 91 symbols, in:3/out:1
- `packages/astrology/src/meaningComplexReportViews.ts` - weight 394.3, ~4580 tokens, 99 symbols, in:2/out:0
- `scripts/lib/semantic-synthesis-v2-evaluation.ts` - weight 299.31, ~4127 tokens, 79 symbols, in:0/out:2
- `apps/astra-web/components/ReportReader.tsx` - weight 290.31, ~3776 tokens, 57 symbols, in:2/out:8
- `packages/astrology/src/normalizedChartFacts.ts` - weight 289.31, ~3967 tokens, 77 symbols, in:1/out:0
- `apps/astra-web/e2e/foundation-routes.spec.ts` - weight 272.24, ~9420 tokens, 74 symbols, in:0/out:2
- `apps/astra-web/app/api/reports/route.ts` - weight 266.36, ~2151 tokens, 42 symbols, in:0/out:3

## Critical Routes
- `POST /api/admin/replay-report` in `apps/astra-web/app/api/admin/replay-report/route.ts:15`
- `DELETE /api/allies/[allyId]` in `apps/astra-web/app/api/allies/[allyId]/route.ts:14`
- `PATCH /api/allies/[allyId]` in `apps/astra-web/app/api/allies/[allyId]/route.ts:31`
- `GET /api/allies` in `apps/astra-web/app/api/allies/route.ts:10`
- `POST /api/allies` in `apps/astra-web/app/api/allies/route.ts:18`
- `POST /api/beta-feedback` in `apps/astra-web/app/api/beta-feedback/route.ts:13`
- `POST /api/billing/create-checkout-session` in `apps/astra-web/app/api/billing/create-checkout-session/route.ts:16`
- `POST /api/chart-arrivals/[chartRequestId]/complete` in `apps/astra-web/app/api/chart-arrivals/[chartRequestId]/complete/route.ts:7`
- `POST /api/chart-arrivals` in `apps/astra-web/app/api/chart-arrivals/route.ts:6`
- `GET /api/chart-requests` in `apps/astra-web/app/api/chart-requests/route.ts:10`
- `POST /api/chart-requests` in `apps/astra-web/app/api/chart-requests/route.ts:18`
- `POST /api/chart-results` in `apps/astra-web/app/api/chart-results/route.ts:6`
- `GET /api/composer/availability` in `apps/astra-web/app/api/composer/availability/route.ts:4`
- `POST /api/composer/onboarding-cards` in `apps/astra-web/app/api/composer/onboarding-cards/route.ts:6`
- `POST /api/composer/private-feed-items` in `apps/astra-web/app/api/composer/private-feed-items/route.ts:6`
- `GET /api/composer/selection` in `apps/astra-web/app/api/composer/selection/route.ts:36`
- `POST /api/composer/stream-artifacts` in `apps/astra-web/app/api/composer/stream-artifacts/route.ts:6`
- `PATCH /api/journey/items/[feedItemId]` in `apps/astra-web/app/api/journey/items/[feedItemId]/route.ts:8`
- `GET /api/places/search` in `apps/astra-web/app/api/places/search/route.ts:10`
- `POST /api/report-results` in `apps/astra-web/app/api/report-results/route.ts:6`
- `POST /api/reports/[requestId]/generate` in `apps/astra-web/app/api/reports/[requestId]/generate/route.ts:18`
- `POST /api/reports/[requestId]/publish-signal` in `apps/astra-web/app/api/reports/[requestId]/publish-signal/route.ts:7`
- `DELETE /api/reports/[requestId]` in `apps/astra-web/app/api/reports/[requestId]/route.ts:16`
- `POST /api/reports/[requestId]/share` in `apps/astra-web/app/api/reports/[requestId]/share/route.ts:21`
- `DELETE /api/reports/[requestId]/share` in `apps/astra-web/app/api/reports/[requestId]/share/route.ts:39`
- `GET /api/reports` in `apps/astra-web/app/api/reports/route.ts:68`
- `POST /api/reports` in `apps/astra-web/app/api/reports/route.ts:81`
- `POST /api/stripe/webhook` in `apps/astra-web/app/api/stripe/webhook/route.ts:45`
- `POST /api/cards/prepare-batch` in `apps/composer-web/app/api/cards/prepare-batch/route.ts:26`
- `POST /api/cards/publish-batch` in `apps/composer-web/app/api/cards/publish-batch/route.ts:11`
- `GET /api/cards/publish-plan` in `apps/composer-web/app/api/cards/publish-plan/route.ts:9`
- `DELETE /api/cards/publish-plan` in `apps/composer-web/app/api/cards/publish-plan/route.ts:24`
- `POST /api/cards/publish` in `apps/composer-web/app/api/cards/publish/route.ts:13`
- `GET /api/cards/query` in `apps/composer-web/app/api/cards/query/route.ts:19`
- `GET /api/cards/queue-draft` in `apps/composer-web/app/api/cards/queue-draft/route.ts:31`
- `PUT /api/cards/queue-draft` in `apps/composer-web/app/api/cards/queue-draft/route.ts:44`
- `DELETE /api/cards/queue-draft` in `apps/composer-web/app/api/cards/queue-draft/route.ts:65`
- `POST /api/chart-arrival/rewrite` in `apps/composer-web/app/api/chart-arrival/rewrite/route.ts:39`
- `GET /api/library/availability` in `apps/composer-web/app/api/library/availability/route.ts:33`
- `GET /api/onboarding/preview` in `apps/composer-web/app/api/onboarding/preview/route.ts:4`
- `POST /api/onboarding/publish` in `apps/composer-web/app/api/onboarding/publish/route.ts:5`
- `POST /api/operator/preview` in `apps/composer-web/app/api/operator/preview/route.ts:4`
- `POST /api/operator/publish` in `apps/composer-web/app/api/operator/publish/route.ts:6`
- `GET /api/status` in `apps/composer-web/app/api/status/route.ts:4`

## Pareto Profiles
- `32000` tokens -> 1 files, 662 symbols, ~45687 estimated tokens.
- `64000` tokens -> 2 files, 887 symbols, ~65582 estimated tokens.
- `128000` tokens -> 8 files, 1894 symbols, ~137736 estimated tokens.

## Data Model
Database/schema ownership is present and should be treated as product runtime architecture, not an Akashic constraint violation.
Auth ownership is present and should be validated through the repo's local auth policy and tests.
Local Akashic artifacts preserve repo-specific decisions, skills, warnings, missions, and REPOMAPs.

## Deployment
This is a Next.js app. Confirm the production build with the repo's build script before launch or deploy readiness.

## Known Risks
- `packages/astrology/src/index.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/repositories.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/astrology/src/meaningComplexNetwork.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/astrology/src/structuralChartFacts.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/composer-web/lib/cardLibrary.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/contracts/src/index.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/components/BirthOnboardingPanel.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/app/admin/page.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/composer-web/components/CardWorkspace.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/astrology/src/meaningComplexReportViews.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `scripts/lib/semantic-synthesis-v2-evaluation.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/components/ReportReader.tsx` needs extra care because it is large or touches auth/data/schema concerns.

## Current Priorities
- Honor this repo's own AGENTS.md, ADRs, REPOMAP, and local Akashic artifacts before applying central guidance.
- Do not inherit Akashic CLI implementation constraints unless this repo is Akashic itself.
- Capture repo-local lessons with `ak capture` or `ak learn`, then ingest them into central Akashic when they should become shared memory.
- For Next.js changes, prove production readiness with typecheck, lint, build, and route/browser verification.
- Treat auth as a first-class product concern and verify the repo's documented local auth flow.
- Keep Composer boundaries explicit: Composer composes and publishes artifacts through contracts.

Generated from 443 local files for `astra-clean-start`.
