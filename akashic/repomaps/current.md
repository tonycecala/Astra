---
title: "Current REPOMAP"
status: "current"
date: "2026-06-16"
updated: "2026-06-16"
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
- Estimated token footprint: `215760`

## Architecture
- `akashic/` contains durable engineering knowledge artifacts.
- Package scripts expose: `build`, `check`, `check:boundaries`, `check:no-supabase`, `composer:dev`, `db:generate`, `db:migrate`, `db:reset:local`, `db:seed`, `db:seed:private-card`, `dev`, `dev:restart`, `dev:status`, `dev:stop`, `dev:up`, `lint`, `start`, `test`, `test:astrology-engine`, `test:auth-code`, `test:chart-boundary`, `test:chart-maker`, `test:chart-request-api`, `test:composer-ingest-api`, `test:composer-stream`, `test:e2e`, `test:place-search-api`, `test:private-feed`, `test:report-api`, `typecheck`.

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
- `akashic/missions` knowledge artifacts
- `akashic/skills` knowledge artifacts
- `akashic/templates` knowledge artifacts
- `akashic/warnings` knowledge artifacts

## Entry Points
- `apps/astra-web/app/api/chart-requests/route.ts` - 2 route handler(s), 2 export(s), 8 symbol(s), 4 import(s), ~323 tokens
- `apps/astra-web/app/api/reports/route.ts` - 2 route handler(s), 2 export(s), 8 symbol(s), 4 import(s), ~334 tokens
- `apps/astra-web/app/api/reports/[requestId]/publish-signal/route.ts` - 1 route handler(s), 1 export(s), 9 symbol(s), 4 import(s), ~784 tokens
- `apps/astra-web/app/api/reports/[requestId]/generate/route.ts` - 1 route handler(s), 1 export(s), 8 symbol(s), 4 import(s), ~313 tokens
- `apps/astra-web/app/api/places/search/route.ts` - 1 route handler(s), 1 export(s), 6 symbol(s), 4 import(s), ~356 tokens
- `apps/astra-web/app/api/chart-results/route.ts` - 1 route handler(s), 1 export(s), 4 symbol(s), 4 import(s), ~255 tokens
- `apps/astra-web/app/api/report-results/route.ts` - 1 route handler(s), 1 export(s), 4 symbol(s), 4 import(s), ~265 tokens
- `apps/astra-web/app/api/composer/stream-artifacts/route.ts` - 1 route handler(s), 1 export(s), 4 symbol(s), 4 import(s), ~234 tokens
- `package.json` - ~787 tokens

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
- `packages/astrology/src/index.ts` - weight 483.26, ~7116 tokens, 119 symbols, in:0/out:0
- `packages/db/src/repositories.ts` - weight 464.25, ~8533 tokens, 100 symbols, in:1/out:2
- `apps/astra-web/components/BirthOnboardingPanel.tsx` - weight 235.27, ~6424 tokens, 50 symbols, in:1/out:1
- `packages/contracts/src/index.ts` - weight 232.3, ~4636 tokens, 90 symbols, in:0/out:0
- `docs/inbox-astra/ASTRA_COMPOSER_PRIVATE_PERSONAL_FEED_DOCTRINE.md` - weight 163.29, ~4775 tokens, 53 symbols, in:0/out:0
- `apps/astra-web/lib/journey.ts` - weight 146.4, ~1371 tokens, 30 symbols, in:2/out:0
- `packages/chart-maker/src/index.ts` - weight 132.4, ~1309 tokens, 28 symbols, in:0/out:0
- `apps/astra-web/app/api/chart-requests/route.ts` - weight 130.92, ~323 tokens, 8 symbols, in:0/out:1
- `apps/astra-web/app/api/reports/route.ts` - weight 130.92, ~334 tokens, 8 symbols, in:0/out:1
- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` - weight 106.32, ~3531 tokens, 34 symbols, in:0/out:0
- `apps/astra-web/components/ThemeToggle.tsx` - weight 103.44, ~687 tokens, 20 symbols, in:1/out:1
- `apps/astra-web/app/api/reports/[requestId]/publish-signal/route.ts` - weight 89.44, ~784 tokens, 9 symbols, in:0/out:1
- `apps/astra-web/app/api/reports/[requestId]/generate/route.ts` - weight 85.84, ~313 tokens, 8 symbols, in:0/out:1
- `apps/astra-web/e2e/foundation-routes.spec.ts` - weight 85.34, ~2872 tokens, 24 symbols, in:0/out:0
- `apps/astra-web/app/api/places/search/route.ts` - weight 80.92, ~356 tokens, 6 symbols, in:0/out:1

## Critical Routes
- `GET /api/chart-requests` in `apps/astra-web/app/api/chart-requests/route.ts:10`
- `POST /api/chart-requests` in `apps/astra-web/app/api/chart-requests/route.ts:18`
- `POST /api/chart-results` in `apps/astra-web/app/api/chart-results/route.ts:6`
- `POST /api/composer/stream-artifacts` in `apps/astra-web/app/api/composer/stream-artifacts/route.ts:6`
- `GET /api/places/search` in `apps/astra-web/app/api/places/search/route.ts:10`
- `POST /api/report-results` in `apps/astra-web/app/api/report-results/route.ts:6`
- `POST /api/reports/[requestId]/generate` in `apps/astra-web/app/api/reports/[requestId]/generate/route.ts:16`
- `POST /api/reports/[requestId]/publish-signal` in `apps/astra-web/app/api/reports/[requestId]/publish-signal/route.ts:16`
- `GET /api/reports` in `apps/astra-web/app/api/reports/route.ts:10`
- `POST /api/reports` in `apps/astra-web/app/api/reports/route.ts:18`

## Pareto Profiles
- `32000` tokens -> 6 files, 442 symbols, ~32855 estimated tokens.
- `64000` tokens -> 36 files, 759 symbols, ~66003 estimated tokens.
- `128000` tokens -> 104 files, 993 symbols, ~141590 estimated tokens.

## Data Model
Database/schema ownership is present and should be treated as product runtime architecture, not an Akashic constraint violation.
Auth ownership is present and should be validated through the repo's local auth policy and tests.
Local Akashic artifacts preserve repo-specific decisions, skills, warnings, missions, and REPOMAPs.

## Deployment
This is a Next.js app. Confirm the production build with the repo's build script before launch or deploy readiness.

## Known Risks
- `packages/astrology/src/index.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/repositories.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/components/BirthOnboardingPanel.tsx` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/contracts/src/index.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `docs/inbox-astra/ASTRA_COMPOSER_PRIVATE_PERSONAL_FEED_DOCTRINE.md` needs extra care because it is large or touches auth/data/schema concerns.
- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/schema.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/lib/auth/server.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/env.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/drizzle.config.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/lib/auth/profile.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `akashic/missions/2026-06-12-astra-clean-start-foundation-progress.md` needs extra care because it is large or touches auth/data/schema concerns.

## Current Priorities
- Honor this repo's own AGENTS.md, ADRs, REPOMAP, and local Akashic artifacts before applying central guidance.
- Do not inherit Akashic CLI implementation constraints unless this repo is Akashic itself.
- Capture repo-local lessons with `ak capture` or `ak learn`, then ingest them into central Akashic when they should become shared memory.
- For Next.js changes, prove production readiness with typecheck, lint, build, and route/browser verification.
- Treat auth as a first-class product concern and verify the repo's documented local auth flow.
- Keep Composer boundaries explicit: Composer composes and publishes artifacts through contracts.

Generated from 130 local files in `/Users/tony/Documents/Projects/Astra`.
