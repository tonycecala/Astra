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
- Estimated token footprint: `135551`

## Architecture
- `akashic/` contains durable engineering knowledge artifacts.
- Package scripts expose: `build`, `check`, `check:boundaries`, `check:no-supabase`, `composer:dev`, `db:generate`, `db:migrate`, `db:reset:local`, `db:seed`, `dev`, `dev:restart`, `dev:status`, `dev:stop`, `dev:up`, `lint`, `start`, `test`, `test:auth-code`, `test:chart-boundary`, `test:chart-maker`, `test:chart-request-api`, `test:composer-ingest-api`, `test:composer-stream`, `test:e2e`, `typecheck`.

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
- `akashic/templates` knowledge artifacts
- `akashic/warnings` knowledge artifacts

## Entry Points
- `apps/astra-web/app/api/chart-requests/route.ts` - 2 route handler(s), 2 export(s), 8 symbol(s), 4 import(s), ~323 tokens
- `apps/astra-web/app/api/chart-results/route.ts` - 1 route handler(s), 1 export(s), 4 symbol(s), 4 import(s), ~255 tokens
- `apps/astra-web/app/api/composer/stream-artifacts/route.ts` - 1 route handler(s), 1 export(s), 4 symbol(s), 4 import(s), ~234 tokens
- `package.json` - ~685 tokens

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
- `packages/db/src/repositories.ts` - weight 213.3, ~4290 tokens, 46 symbols, in:1/out:2
- `packages/chart-maker/src/index.ts` - weight 132.4, ~1309 tokens, 28 symbols, in:0/out:0
- `apps/astra-web/app/api/chart-requests/route.ts` - weight 130.92, ~323 tokens, 8 symbols, in:0/out:1
- `packages/contracts/src/index.ts` - weight 127.36, ~2282 tokens, 48 symbols, in:0/out:0
- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` - weight 106.32, ~3449 tokens, 34 symbols, in:0/out:0
- `apps/astra-web/components/ThemeToggle.tsx` - weight 103.44, ~687 tokens, 20 symbols, in:1/out:1
- `apps/astra-web/components/ChartRequestPanel.tsx` - weight 79.38, ~1673 tokens, 14 symbols, in:1/out:1
- `apps/composer-web/src/voices/validateVoiceCard.ts` - weight 70.45, ~653 tokens, 13 symbols, in:2/out:1
- `apps/astra-web/app/api/chart-results/route.ts` - weight 69.68, ~255 tokens, 4 symbols, in:0/out:1
- `apps/astra-web/app/api/composer/stream-artifacts/route.ts` - weight 69.58, ~234 tokens, 4 symbols, in:0/out:1
- `apps/astra-web/lib/email/send-email.ts` - weight 60.29, ~444 tokens, 10 symbols, in:1/out:0
- `apps/astra-web/lib/auth/server.ts` - weight 58.36, ~564 tokens, 8 symbols, in:2/out:1
- `apps/astra-web/components/StreamReader.tsx` - weight 54.39, ~1453 tokens, 11 symbols, in:1/out:1
- `apps/astra-web/components/AuthPanel.tsx` - weight 50.42, ~1058 tokens, 7 symbols, in:1/out:2
- `packages/db/src/schema.ts` - weight 50.35, ~2425 tokens, 14 symbols, in:2/out:0

## Critical Routes
- `GET /api/chart-requests` in `apps/astra-web/app/api/chart-requests/route.ts:10`
- `POST /api/chart-requests` in `apps/astra-web/app/api/chart-requests/route.ts:18`
- `POST /api/chart-results` in `apps/astra-web/app/api/chart-results/route.ts:6`
- `POST /api/composer/stream-artifacts` in `apps/astra-web/app/api/composer/stream-artifacts/route.ts:6`

## Pareto Profiles
- `32000` tokens -> 31 files, 388 symbols, ~32158 estimated tokens.
- `64000` tokens -> 78 files, 500 symbols, ~133175 estimated tokens.
- `128000` tokens -> 78 files, 500 symbols, ~133175 estimated tokens.

## Data Model
Database/schema ownership is present and should be treated as product runtime architecture, not an Akashic constraint violation.
Auth ownership is present and should be validated through the repo's local auth policy and tests.
Local Akashic artifacts preserve repo-specific decisions, skills, warnings, missions, and REPOMAPs.

## Deployment
This is a Next.js app. Confirm the production build with the repo's build script before launch or deploy readiness.

## Known Risks
- `packages/db/src/repositories.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/lib/auth/server.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/schema.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/env.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/drizzle.config.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/client.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/lib/auth/profile.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `docs/decisions/0001-next-neon-drizzle-better-auth.md` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/seed.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/app/api/auth/[...all]/route.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/lib/auth/client.ts` needs extra care because it is large or touches auth/data/schema concerns.

## Current Priorities
- Honor this repo's own AGENTS.md, ADRs, REPOMAP, and local Akashic artifacts before applying central guidance.
- Do not inherit Akashic CLI implementation constraints unless this repo is Akashic itself.
- Capture repo-local lessons with `ak capture` or `ak learn`, then ingest them into central Akashic when they should become shared memory.
- For Next.js changes, prove production readiness with typecheck, lint, build, and route/browser verification.
- Treat auth as a first-class product concern and verify the repo's documented local auth flow.
- Keep Composer boundaries explicit: Composer composes and publishes artifacts through contracts.

Generated from 102 local files in `/Users/tony/Documents/Projects/Astra`.
