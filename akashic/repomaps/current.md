---
title: "Current REPOMAP"
status: "current"
date: "2026-06-11"
updated: "2026-06-11"
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
- Estimated token footprint: `107574`

## Architecture
- `akashic/` contains durable engineering knowledge artifacts.
- Package scripts expose: `build`, `check`, `check:boundaries`, `check:no-supabase`, `composer:dev`, `db:generate`, `db:migrate`, `db:reset:local`, `db:seed`, `dev`, `lint`, `start`, `test`, `test:auth-code`, `test:e2e`, `typecheck`.

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
- `akashic/templates` knowledge artifacts
- `akashic/warnings` knowledge artifacts

## Entry Points
- `package.json` - ~515 tokens

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
- `packages/db/src/repositories.ts` - weight 115.34, ~2850 tokens, 24 symbols, in:1/out:2
- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` - weight 106.32, ~3449 tokens, 34 symbols, in:0/out:0
- `apps/astra-web/components/ThemeToggle.tsx` - weight 103.44, ~687 tokens, 20 symbols, in:1/out:1
- `apps/astra-web/lib/email/send-email.ts` - weight 60.29, ~444 tokens, 10 symbols, in:1/out:0
- `apps/astra-web/lib/auth/server.ts` - weight 58.36, ~564 tokens, 8 symbols, in:2/out:1
- `packages/contracts/src/index.ts` - weight 55.44, ~852 tokens, 20 symbols, in:0/out:0
- `apps/astra-web/components/StreamReader.tsx` - weight 54.39, ~1453 tokens, 11 symbols, in:1/out:1
- `apps/astra-web/components/AuthPanel.tsx` - weight 50.42, ~1058 tokens, 7 symbols, in:1/out:2
- `apps/astra-web/app/layout.tsx` - weight 44.39, ~688 tokens, 8 symbols, in:0/out:2
- `packages/db/src/schema.ts` - weight 44.37, ~1983 tokens, 12 symbols, in:2/out:0
- `packages/db/src/env.ts` - weight 37.45, ~206 tokens, 5 symbols, in:2/out:0
- `packages/db/drizzle.config.ts` - weight 37.01, ~291 tokens, 6 symbols, in:0/out:0
- `akashic/templates/repomap-template.md` - weight 35.89, ~126 tokens, 10 symbols, in:0/out:0
- `apps/astra-web/lib/foundation.ts` - weight 33.29, ~131 tokens, 5 symbols, in:5/out:0
- `akashic/templates/skill-template.md` - weight 32.83, ~118 tokens, 9 symbols, in:0/out:0

## Critical Routes
- No route files detected.

## Pareto Profiles
- `32000` tokens -> 57 files, 296 symbols, ~35438 estimated tokens.
- `64000` tokens -> 58 files, 296 symbols, ~105901 estimated tokens.
- `128000` tokens -> 78 files, 296 symbols, ~107574 estimated tokens.

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

Generated from 78 local files in `/Users/tony/Documents/Projects/Astra`.
