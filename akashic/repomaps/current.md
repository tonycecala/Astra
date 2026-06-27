---
title: "Current REPOMAP"
type: "repomap"
description: "Current repository map for agent onboarding and code navigation."
status: "current"
project: "akashic"
date: "2026-06-27"
created: "2026-06-27"
updated: "2026-06-27"
timestamp: "2026-06-27"
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
- Estimated token footprint: `847600`

## Architecture
- `akashic/` contains durable engineering knowledge artifacts.
- Package scripts expose: `build`, `check`, `check:boundaries`, `check:no-supabase`, `composer:dev`, `composer:logs`, `composer:restart`, `composer:status`, `composer:stop`, `composer:up`, `db:generate`, `db:migrate`, `db:reset:local`, `db:seed`, `db:seed:private-card`, `dev`, `dev:restart`, `dev:status`, `dev:stop`, `dev:up`, `lint`, `report:bakeoff`, `start`, `stripe:fulfill-latest`, `test`, `test:ally-api`, `test:astrology-engine`, `test:auth-code`, `test:chart-boundary`, `test:chart-maker`, `test:chart-request-api`, `test:composer-availability-api`, `test:composer-card-detail`, `test:composer-card-queue-api`, `test:composer-course-ux`, `test:composer-ingest-api`, `test:composer-onboarding-cards`, `test:composer-onboarding-mobile`, `test:composer-operator-workflow`, `test:composer-private-feed-api`, `test:composer-quarry`, `test:composer-selection-api`, `test:composer-stream`, `test:e2e`, `test:place-search-api`, `test:private-feed`, `test:report-api`, `test:report-families`, `test:stripe-checkout`, `test:stripe-webhook`, `test:tony-deep-sonnet`, `typecheck`.

## Directory Structure
```txt
AGENTS.md
ASTRA_CLEAN_START_INAUGURAL_CHARTER.md
README.md
akashic/
apps/
docs/
eslint.config.mjs
package-lock.json
package.json
packages/
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
- `apps/composer-web/app/api/cards/queue-draft/route.ts` - 3 route handler(s), 3 export(s), 22 symbol(s), 4 import(s), ~679 tokens
- `apps/astra-web/app/api/reports/route.ts` - 2 route handler(s), 2 export(s), 24 symbol(s), 6 import(s), ~1013 tokens
- `apps/astra-web/app/api/reports/[requestId]/share/route.ts` - 2 route handler(s), 2 export(s), 10 symbol(s), 3 import(s), ~372 tokens
- `apps/composer-web/app/api/cards/publish-plan/route.ts` - 2 route handler(s), 2 export(s), 10 symbol(s), 2 import(s), ~306 tokens
- `apps/astra-web/app/api/allies/route.ts` - 2 route handler(s), 2 export(s), 8 symbol(s), 4 import(s), ~294 tokens
- `apps/astra-web/app/api/chart-requests/route.ts` - 2 route handler(s), 2 export(s), 8 symbol(s), 4 import(s), ~323 tokens
- `apps/astra-web/app/api/stripe/webhook/route.ts` - 1 route handler(s), 2 export(s), 20 symbol(s), 4 import(s), ~790 tokens
- `apps/composer-web/app/api/library/availability/route.ts` - 1 route handler(s), 1 export(s), 16 symbol(s), 4 import(s), ~635 tokens
- `apps/astra-web/app/api/composer/selection/route.ts` - 1 route handler(s), 1 export(s), 12 symbol(s), 3 import(s), ~665 tokens
- `apps/composer-web/app/api/cards/prepare-batch/route.ts` - 1 route handler(s), 1 export(s), 12 symbol(s), 5 import(s), ~639 tokens
- `apps/astra-web/app/api/admin/replay-report/route.ts` - 1 route handler(s), 1 export(s), 12 symbol(s), 5 import(s), ~723 tokens
- `apps/composer-web/app/api/cards/query/route.ts` - 1 route handler(s), 1 export(s), 10 symbol(s), 2 import(s), ~349 tokens
- `apps/astra-web/app/api/billing/create-checkout-session/route.ts` - 1 route handler(s), 2 export(s), 13 symbol(s), 4 import(s), ~709 tokens
- `apps/astra-web/app/api/composer/availability/route.ts` - 1 route handler(s), 1 export(s), 9 symbol(s), 2 import(s), ~411 tokens
- `apps/astra-web/app/api/reports/[requestId]/publish-signal/route.ts` - 1 route handler(s), 1 export(s), 9 symbol(s), 5 import(s), ~896 tokens
- `apps/astra-web/app/api/reports/[requestId]/generate/route.ts` - 1 route handler(s), 1 export(s), 9 symbol(s), 5 import(s), ~417 tokens
- `apps/composer-web/app/api/cards/publish-batch/route.ts` - 1 route handler(s), 1 export(s), 9 symbol(s), 4 import(s), ~515 tokens
- `apps/composer-web/app/api/cards/publish/route.ts` - 1 route handler(s), 1 export(s), 8 symbol(s), 4 import(s), ~420 tokens
- `apps/astra-web/app/api/places/search/route.ts` - 1 route handler(s), 1 export(s), 6 symbol(s), 4 import(s), ~356 tokens
- `apps/astra-web/app/api/beta-feedback/route.ts` - 1 route handler(s), 1 export(s), 7 symbol(s), 4 import(s), ~386 tokens

## External Integrations
- Auth provider/library
- Drizzle
- Next.js
- Postgres
- React

## Data Flow
1. Source files define local behavior.
2. Package scripts provide build/test/runtime entry points where available.
3. Akashic artifacts preserve durable repo knowledge.

## Critical Files
- `packages/astrology/src/index.ts` - weight 1195.18, ~18456 tokens, 285 symbols, in:0/out:0
- `packages/db/src/repositories.ts` - weight 956.18, ~18057 tokens, 199 symbols, in:1/out:2
- `apps/composer-web/lib/cardLibrary.ts` - weight 585.24, ~8636 tokens, 135 symbols, in:16/out:13
- `apps/astra-web/app/admin/page.tsx` - weight 469.23, ~10755 tokens, 96 symbols, in:0/out:2
- `apps/composer-web/components/CardWorkspace.tsx` - weight 457.24, ~9273 tokens, 91 symbols, in:3/out:1
- `apps/astra-web/components/BirthOnboardingPanel.tsx` - weight 374.23, ~10264 tokens, 81 symbols, in:2/out:2
- `packages/contracts/src/index.ts` - weight 320.27, ~6385 tokens, 125 symbols, in:0/out:0
- `apps/astra-web/app/library/page.tsx` - weight 249.33, ~2940 tokens, 46 symbols, in:0/out:5
- `apps/astra-web/components/ReportReader.tsx` - weight 240.33, ~3054 tokens, 44 symbols, in:3/out:5
- `apps/astra-web/components/FullChartWheel.tsx` - weight 228.32, ~3362 tokens, 52 symbols, in:1/out:1
- `apps/composer-web/app/api/cards/queue-draft/route.ts` - weight 227.38, ~679 tokens, 22 symbols, in:0/out:2
- `apps/astra-web/e2e/foundation-routes.spec.ts` - weight 208.27, ~6155 tokens, 55 symbols, in:0/out:0
- `apps/astra-web/app/api/reports/route.ts` - weight 205.42, ~1013 tokens, 24 symbols, in:0/out:2
- `apps/astra-web/app/allies/page.tsx` - weight 171.33, ~3135 tokens, 37 symbols, in:0/out:6
- `docs/inbox-astra/ASTRA_COMPOSER_PRIVATE_PERSONAL_FEED_DOCTRINE.md` - weight 163.29, ~4775 tokens, 53 symbols, in:0/out:0

## Critical Routes
- `POST /api/admin/replay-report` in `apps/astra-web/app/api/admin/replay-report/route.ts:15`
- `DELETE /api/allies/[allyId]` in `apps/astra-web/app/api/allies/[allyId]/route.ts:13`
- `GET /api/allies` in `apps/astra-web/app/api/allies/route.ts:10`
- `POST /api/allies` in `apps/astra-web/app/api/allies/route.ts:18`
- `POST /api/beta-feedback` in `apps/astra-web/app/api/beta-feedback/route.ts:13`
- `POST /api/billing/create-checkout-session` in `apps/astra-web/app/api/billing/create-checkout-session/route.ts:16`
- `GET /api/chart-requests` in `apps/astra-web/app/api/chart-requests/route.ts:10`
- `POST /api/chart-requests` in `apps/astra-web/app/api/chart-requests/route.ts:18`
- `POST /api/chart-results` in `apps/astra-web/app/api/chart-results/route.ts:6`
- `GET /api/composer/availability` in `apps/astra-web/app/api/composer/availability/route.ts:12`
- `POST /api/composer/onboarding-cards` in `apps/astra-web/app/api/composer/onboarding-cards/route.ts:6`
- `POST /api/composer/private-feed-items` in `apps/astra-web/app/api/composer/private-feed-items/route.ts:6`
- `GET /api/composer/selection` in `apps/astra-web/app/api/composer/selection/route.ts:36`
- `POST /api/composer/stream-artifacts` in `apps/astra-web/app/api/composer/stream-artifacts/route.ts:6`
- `GET /api/places/search` in `apps/astra-web/app/api/places/search/route.ts:10`
- `POST /api/report-results` in `apps/astra-web/app/api/report-results/route.ts:6`
- `POST /api/reports/[requestId]/generate` in `apps/astra-web/app/api/reports/[requestId]/generate/route.ts:17`
- `POST /api/reports/[requestId]/publish-signal` in `apps/astra-web/app/api/reports/[requestId]/publish-signal/route.ts:17`
- `DELETE /api/reports/[requestId]` in `apps/astra-web/app/api/reports/[requestId]/route.ts:16`
- `POST /api/reports/[requestId]/share` in `apps/astra-web/app/api/reports/[requestId]/share/route.ts:21`
- `DELETE /api/reports/[requestId]/share` in `apps/astra-web/app/api/reports/[requestId]/share/route.ts:39`
- `GET /api/reports` in `apps/astra-web/app/api/reports/route.ts:43`
- `POST /api/reports` in `apps/astra-web/app/api/reports/route.ts:56`
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
- `GET /api/library/availability` in `apps/composer-web/app/api/library/availability/route.ts:33`
- `GET /api/onboarding/preview` in `apps/composer-web/app/api/onboarding/preview/route.ts:4`
- `POST /api/onboarding/publish` in `apps/composer-web/app/api/onboarding/publish/route.ts:5`
- `POST /api/operator/preview` in `apps/composer-web/app/api/operator/preview/route.ts:4`
- `POST /api/operator/publish` in `apps/composer-web/app/api/operator/publish/route.ts:6`
- `GET /api/status` in `apps/composer-web/app/api/status/route.ts:4`

## Pareto Profiles
- `32000` tokens -> 2 files, 484 symbols, ~36513 estimated tokens.
- `64000` tokens -> 5 files, 806 symbols, ~65177 estimated tokens.
- `128000` tokens -> 24 files, 1581 symbols, ~128145 estimated tokens.

## Data Model
Database/schema ownership is present and should be treated as product runtime architecture, not an Akashic constraint violation.
Auth ownership is present and should be validated through the repo's local auth policy and tests.
Local Akashic artifacts preserve repo-specific decisions, skills, warnings, missions, and REPOMAPs.

## Deployment
This is a Next.js app. Confirm the production build with the repo's build script before launch or deploy readiness.

## Known Risks
- `packages/astrology/src/index.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/repositories.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/composer-web/lib/cardLibrary.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/app/admin/page.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/composer-web/components/CardWorkspace.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/components/BirthOnboardingPanel.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/contracts/src/index.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/components/ReportReader.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/components/FullChartWheel.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/e2e/foundation-routes.spec.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/app/allies/page.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `docs/inbox-astra/ASTRA_COMPOSER_PRIVATE_PERSONAL_FEED_DOCTRINE.md` needs extra care because it is large or touches auth/data/schema concerns.

## Current Priorities
- Honor this repo's own AGENTS.md, ADRs, REPOMAP, and local Akashic artifacts before applying central guidance.
- Do not inherit Akashic CLI implementation constraints unless this repo is Akashic itself.
- Capture repo-local lessons with `ak capture` or `ak learn`, then ingest them into central Akashic when they should become shared memory.
- For Next.js changes, prove production readiness with typecheck, lint, build, and route/browser verification.
- Treat auth as a first-class product concern and verify the repo's documented local auth flow.
- Keep Composer boundaries explicit: Composer composes and publishes artifacts through contracts.

Generated from 319 local files in `/Users/tony/Documents/Projects/Astra`.
