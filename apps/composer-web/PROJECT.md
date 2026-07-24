# Project Passport: Composer

Last verified: 2026-07-24

- State: Live alpha operator service
- Release: `0.1.0` alpha
- Size: Small — ~77 tracked files / 1.3 MB, included in the Astra monorepo
- Hosting: Vercel `composer-alpha`
- URLs: `https://composer-alpha-astra-labs.vercel.app`; local `http://127.0.0.1:3012`
- Reserved port: `3012`

## Purpose

Compose, curate, and publish public source cards plus permissioned private-feed projections consumed by Astra.

## Stack

Next.js 16, React 19, TypeScript, shared Astra contracts/database/UI packages, and token-protected operator APIs.

## Operate

From the Astra repository root:

```bash
npm run composer:up
npm run composer:status
npm run check:composer-alpha-env
```

## Current Constraint

Public read APIs may be reachable, but operator UI and mutation APIs must remain protected. Raw private Astra report payloads must never enter shared/public rows.

## Recommended Next Action

Keep the public/private boundary and durable operator workflow verified as publishing behavior evolves.

## Evidence

- `package.json`
- `../../docs/operations/alpha-vercel-launch.md`
- `../../docs/architecture/clean-start-foundation.md`
- `../../akashic/repomaps/current.md`
