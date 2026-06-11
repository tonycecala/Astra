---
title: "Current REPOMAP"
status: "current"
date: "2026-06-10"
updated: "2026-06-10"
tags: ["repomap", "onboarding"]
related: []
---

# REPOMAP

## Purpose
This repository contains `astra-clean-start`. No package description found.

## Architecture
- `akashic/` contains durable engineering knowledge artifacts.
- Package scripts expose: `build`, `check`, `check:no-supabase`, `composer:dev`, `db:generate`, `db:migrate`, `db:reset:local`, `db:seed`, `dev`, `lint`, `start`, `test`, `test:auth-code`, `test:e2e`, `typecheck`.

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
- `akashic/decisions` knowledge artifacts
- `akashic/templates` knowledge artifacts

## Entry Points
- `package.json`

## External Integrations
- `@astra/contracts`
- `@astra/db`
- `@astra/testkit`
- `@better-auth/drizzle-adapter`
- `@playwright/test`
- `better-auth`
- `better-auth/client/plugins`
- `better-auth/next-js`
- `better-auth/plugins`
- `better-auth/react`
- `drizzle-kit`
- `drizzle-orm`
- `drizzle-orm/pg-core`
- `drizzle-orm/postgres-js`
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`
- `lucide-react`
- `next`
- `next/headers`
- `next/link`
- `next/navigation`
- `nodemailer`
- `postgres`
- `react`
- `resend`
- `zod`

## Data Flow
1. Source files define local behavior.
2. Package scripts provide build/test/runtime entry points where available.
3. Akashic artifacts preserve durable repo knowledge.

## Critical Files
- `packages/contracts/src/index.ts` - 18 exports, 1 imports
- `packages/db/src/schema.ts` - 12 exports, 2 imports
- `packages/db/src/repositories.ts` - 10 exports, 5 imports
- `package.json` - 1955 bytes
- `packages/db/src/client.ts` - 3 exports, 4 imports
- `apps/astra-web/lib/auth/server.ts` - 2 exports, 6 imports
- `akashic/templates/mission-template.md` - 8 headings
- `akashic/templates/repomap-template.md` - 8 headings
- `akashic/templates/skill-template.md` - 8 headings
- `akashic/decisions/ADR-20260610-astra-clean-start-local-posture.md` - 7 headings
- `akashic/templates/adr-template.md` - 7 headings
- `akashic/templates/playbook-template.md` - 5 headings
- `apps/astra-web/app/layout.tsx` - 1 exports, 5 imports
- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` - 8 headings
- `akashic/templates/warning-template.md` - 4 headings

## Critical Routes
- No route files detected.

## Data Model
Database/schema ownership is present and should be treated as product runtime architecture, not an Akashic constraint violation.
Auth ownership is present and should be validated through the repo's local auth policy and tests.
Local Akashic artifacts preserve repo-specific decisions, skills, warnings, missions, and REPOMAPs.

## Deployment
This is a Next.js app. Confirm the production build with the repo's build script before launch or deploy readiness.

## Known Risks
- `packages/db/src/schema.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/repositories.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/client.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/lib/auth/server.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/lib/auth/client.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/lib/auth/profile.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `docs/decisions/0001-next-neon-drizzle-better-auth.md` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/index.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/seed.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `packages/db/src/env.ts` needs extra care because it is large or touches auth/data/schema concerns.
- `apps/astra-web/app/api/auth/[...all]/route.ts` needs extra care because it is large or touches auth/data/schema concerns.

## Current Priorities
- Honor this repo's own AGENTS.md, ADRs, REPOMAP, and local Akashic artifacts before applying central guidance.
- Do not inherit Akashic CLI implementation constraints unless this repo is Akashic itself.
- Capture repo-local lessons with `ak capture` or `ak learn`, then ingest them into central Akashic when they should become shared memory.
- For Next.js changes, prove production readiness with typecheck, lint, build, and route/browser verification.
- Treat auth as a first-class product concern and verify the repo's documented local auth flow.
- Keep Composer boundaries explicit: Composer composes and publishes artifacts through contracts.

Generated from 72 local files in `/Users/tony/Documents/Projects/Astra`.
