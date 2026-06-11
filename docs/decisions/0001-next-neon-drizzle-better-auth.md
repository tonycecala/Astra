# ADR 0001: Next, Neon, Drizzle, Better Auth

## Decision

Astra Clean Start uses Next.js, React, TypeScript, Neon Postgres, Drizzle, Better Auth, Vercel, and Playwright.

## Context

The old Astria repository contains useful product wisdom but also legacy auth and database coupling. The branch `codex/astra-v2-better-auth-drizzle-neon` established the intended replacement direction, while the clean-start charter explicitly rejects Supabase carryover and migration-shaped compatibility.

## Consequences

- Drizzle owns schema and migrations.
- Better Auth owns authentication/session tables and app session resolution.
- Neon is treated as Postgres, not as a Supabase replacement.
- Application runtime performs queries only; no request-time DDL, grants, role creation, or policy creation.
- Email delivery is routed through an app boundary so Better Auth is not coupled to a provider.
- Playwright route checks are part of the foundation acceptance standard.
- Local Postgres is used for repeatable migrate, seed, and reset proof before Vercel/Neon environment wiring.
