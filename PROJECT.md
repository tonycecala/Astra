# Project Passport: Astra

Last verified: 2026-07-24

- State: Live alpha
- Release: `0.1.0` alpha
- Size: Medium — ~446 tracked files / 6.5 MB
- Hosting: Vercel `astra-alpha` + isolated Neon database
- URLs: `https://alpha.astraportrait.com`; local `http://127.0.0.1:3011`
- Reserved port: `3011`

## Purpose

Private symbolic-reader product for Self, Allies, charts, reports, Library, Journey, Stars, and account workflows.

## Stack

Next.js 16, React 19, TypeScript, Drizzle ORM, Neon/PostgreSQL, Better Auth, Resend/Mailpit, OpenRouter, and Playwright.

## Operate

```bash
npm run dev:up
npm run dev:status
npm run check
```

## Current Constraint

The private, authenticated, user-owned product path must stay separate from Composer's public source material and fallback data. No Supabase carryover is allowed.

## Recommended Next Action

Select and prove the production birth-place search provider without changing the existing `/api/places/search` contract.

## Evidence

- `README.md`
- `package.json`
- `.vercel/project.json`
- `docs/operations/alpha-vercel-launch.md`
- `akashic/repomaps/current.md`
