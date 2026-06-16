---
title: "Fresh thread Astra foundation next step"
status: "acknowledged"
priority: "high"
type: "handoff"
from: "/Users/tony/Documents/Projects/Astra"
to: "/Users/tony/Documents/Projects/Astra"
created: "2026-06-15"
date: "2026-06-15"
updated: "2026-06-15"
tags: ["agent-message", "handoff", "fresh-thread", "astra", "foundation", "high"]
related: ["../missions/2026-06-12-astra-clean-start-foundation-progress.md", "../../docs/architecture/clean-start-foundation.md"]
---

# Fresh Thread Astra Foundation Next Step

## Message
Resume Astra as a clean-start foundation, not a migration. This repo is the new lean Astra; `/Users/tony/Documents/Projects/Astria` is quarry only. The product target is a light symbolic stream reader with stable subassemblies: Astra renders, Composer composes later, packages define/compute/persist.

## Current State
- Branch: `codex/clean-start-foundation`.
- Astra app runs on `http://localhost:3011` via durable local server controls.
- Use `npm run dev:status` before trusting a browser tab; use `npm run dev:restart` if the route is unhealthy.
- Visible routes exist for Journey, Allies, Self, Library, Gifts, and Login.
- Composer exists only as `apps/composer-web` placeholder boundary.
- Core architecture is Next.js, React, TypeScript, Drizzle/Postgres, Better Auth, Playwright, and Vercel posture.
- No Supabase carryover is allowed.
- UI handles must flow through i18n.
- Preferred auth is email code first: send code, verify code, no password-first UX.
- Mailpit is the preferred local email sink.

## Natural Next Step
Make the local database and auth loop real:

1. Verify the disposable local Postgres/Neon-style database choice.
2. Run `npm run db:migrate`.
3. Run `npm run db:seed -- --execute`.
4. Run `npm run db:reset:local -- --execute` only after confirming the local-host guard and disposable DB target.
5. With Mailpit running, execute `npm run test:auth-code`.
6. Browser-check `/login` and the post-auth session/profile path.

## Guardrails
- Do not copy old Astria routes wholesale.
- Do not add Composer internals to Astra.
- Do not add Supabase packages, env vars, imports, RLS policy assumptions, compatibility shims, or runtime DDL.
- Do not use Docker unless Tony explicitly asks; keep the local path simple.
- Use `astra-browser-qa` for route/auth/navigation/user-journey work.
- Update `akashic/missions/2026-06-12-astra-clean-start-foundation-progress.md` before closeout.

## Proof Expected
- `npm run dev:status`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run build`
- `npm run test:e2e`
- auth-code smoke after local DB and Mailpit are available

## Handling
- Read this first in the fresh thread.
- Acknowledge, act, explicitly defer, supersede, or close this message by updating the frontmatter `status`.
- Valid statuses: `new`, `acknowledged`, `acted`, `deferred`, `superseded`, `closed`.

## Status Note
This handoff is marked `acknowledged` so it does not block the current closeout. Fresh Astra threads should still read it before continuing foundation work.
