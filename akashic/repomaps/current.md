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
- `akashic/templates/adr-template.md` - 7 headings
- `akashic/templates/playbook-template.md` - 5 headings
- `apps/astra-web/app/layout.tsx` - 1 exports, 5 imports
- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` - 8 headings
- `akashic/templates/warning-template.md` - 4 headings
- `apps/astra-web/components/AuthPanel.tsx` - 1 exports, 4 imports

## Critical Routes
- No route files detected.

## Data Model
Akashic stores knowledge as Markdown files with lightweight frontmatter. Artifact relationships are represented by relative links and `related` frontmatter entries.

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
- Keep Astra lean, light, modular, and stream-reader first.
- Preserve the clean architecture stack: Next.js, React, TypeScript, Drizzle, Postgres/Neon, Better Auth, Mailpit, and Playwright.
- Keep the preferred auth path email-code first, with Mailpit as the local email default.
- Keep Composer as a placeholder boundary until Astra can consume published stream artifacts through explicit contracts.
- Keep Supabase-era code, env vars, policies, and compatibility shims out of this repo.

Generated from 71 local files in `/Users/tony/Documents/Projects/Astra`.
