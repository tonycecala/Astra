---
title: "Astra Clean Start Foundation Progress"
status: "open"
date: "2026-06-12"
updated: "2026-06-16"
tags: ["mission", "astra", "clean-start", "foundation", "progress"]
related: ["../../docs/architecture/clean-start-foundation.md", "../../ASTRA_CLEAN_START_INAUGURAL_CHARTER.md"]
---

# Astra Clean Start Foundation Progress

## Mission
Build Astra as a clean-start foundation: a lean, light, modular symbolic stream reader with stable subassemblies, explicit contracts, Better Auth, Drizzle/Postgres, seeded data, durable local operation, and no Supabase carryover.

## Goal
Keep `/Users/tony/Documents/Projects/Astra` as the new clean repo and `/Users/tony/Documents/Projects/Astria` as the quarry. Astra should render the first useful reader shell while Composer remains a clean placeholder boundary until publishing contracts exist.

## Files Changed
- `apps/astra-web/` implements the visible reader shell, auth route, i18n-backed UI chrome, theme behavior, and route-level product surfaces.
- `apps/composer-web/` exists as a placeholder subassembly with no Astra runtime coupling.
- `packages/contracts/` defines typed core nouns.
- `packages/db/` owns Drizzle schema, migrations, client, repository helpers, seed/reset support, and Better Auth tables.
- `packages/testkit/` owns typed seed fixtures.
- `scripts/` contains foundation checks, no-Supabase checks, boundary checks, seed/reset scripts, auth-code smoke support, and durable local server controls.
- `docs/architecture/clean-start-foundation.md` documents the foundation shape and local database/auth loop.
- `docs/architecture/local-dev-server.md` documents durable local server operation.
- `akashic/warnings/local-dev-server-tab-is-not-server-proof.md` captures the stale-tab/server-proof lesson.

## Decisions Made
- Astra and Composer are subassemblies inside one npm workspace repo, not nested git repos or submodules.
- Astra is a fresh app and only migrates structure, contracts, and proven ideas; old routes and old clutter stay behind.
- Foundation stack is Next.js, React, TypeScript, Drizzle, Postgres/Neon posture, Better Auth, Vercel posture, and Playwright.
- User-facing UI handles, navigation labels, headings, aria labels, buttons, tabs, and state labels must flow through i18n.
- Preferred auth UX is email code first: send code, verify code, continue without password-first framing.
- Mailpit is the preferred local email sink.
- Composer internals must not leak into Astra.
- Supabase carryover is forbidden: no packages, env vars, imports, legacy policy assumptions, compatibility shims, or runtime DDL.
- Long-running local app review should use durable server controls instead of foreground-only dev sessions.

## Problems Encountered
- A foreground Next.js dev server on port `3011` became unreliable across agent/platform sessions.
- A stale browser tab could make the app appear available or unavailable without proving the server was actually healthy.
- A wedged process could listen on `3011` while `/login` timed out.
- Astra initially had an unread Akashic inbox message about the Munch stack; it was acted on and the repo was indexed locally.

## Lessons Learned
- For local app work, `port listening` is not enough; status must verify a real route response.
- Durable local launchers should write ignored pid/log state and provide `up`, `status`, `restart`, and `stop`.
- Akashic-facing repos need a durable progress artifact, not only chat summaries or README notes.
- The Akashic term for this structured progress record is `mission`.

## Current State
- Astra server is running on `http://localhost:3011`.
- `npm run dev:status` reports `/login 200 OK`.
- Journey, Allies, Self, Library, Gifts, and Login render.
- Playwright route coverage includes desktop, tablet, and mobile.
- Recent validation passed: lint, typecheck, foundation test, boundary check, no-Supabase check, production build, and Playwright e2e.
- Latest relevant Astra commits include durable local server work and Akashic governance installation.
- Local Postgres `postgresql://astra:astra@127.0.0.1:5432/astra_clean_start` is available through Homebrew PostgreSQL 16.
- Drizzle migration, seed, local guarded reset, remigration, and reseed have been exercised against the disposable local database.
- Mailpit is running at `http://localhost:8025`, and the email-code auth smoke passed through send-code, Mailpit OTP read, verify-code, session check, and sign-out.
- Browser verification proved `/login` can send and verify an email code and then display the authenticated session for the browser-smoke user.
- `/self` now reads authenticated app profile state through `getAstraAuthContext`; logged-out visitors see a sign-in CTA, while signed-in users see their own display name, onboarding state, and private star balance.
- Chart-maker contracts now accept birth data plus optional question, intent, and context.
- Drizzle owns `chart_requests` and `chart_results` tables with user ownership and request/result indexes.
- `npm run test:chart-boundary` proves the local request/result lifecycle against Postgres.
- Composer's first publish target is now a shared stream artifact contract.

## Follow-Ups
- Add authenticated route handlers or server actions for creating chart requests from the app UI.
- Implement the independent chart-maker module behind the `ChartMakerRequest` and `ChartMakerResult` contracts.
- Implement Composer's stream artifact validation/publish path without importing Astra app internals.
- Add edge-first caching with origin fallback after published stream artifacts exist.
- Continue polishing reader density, card states, gifts/stars presentation, self/profile usefulness, and i18n-backed empty/error/loading states.
- Update this mission after each non-trivial dev/debug session.
