---
title: "Astra Clean Start Local Posture"
status: "accepted"
date: "2026-06-10"
updated: "2026-06-10"
tags: ["adr", "captured"]
related: []
---
# ADR: Astra Clean Start Local Posture

## Date
2026-06-10

## Status
Accepted

## Decision
Astra is a Next.js + React + TypeScript clean-start symbolic reader/account app. This repo intentionally has UI, Better Auth, Drizzle, Postgres/Neon-oriented schema, Mailpit local email, Playwright QA, and a code-first login preference. Do not apply Akashic Q1 local-only CLI constraints such as no UI, database, or auth to Astra.

## Context
Astra is not the Akashic CLI repository. It is a clean-start product repo created from the Astra charter and Astria quarry research. Local Akashic onboarding should therefore preserve Astra-specific product and platform constraints instead of inheriting central Akashic Q1 implementation constraints.

## Alternatives
- Treat Astra as a generic Akashic Q1 repository: rejected because Astra intentionally has UI, auth, database, and app runtime concerns.
- Rely only on central Akashic guidance: rejected because future agents need local repo context before broad source inspection.
- Keep only `AGENTS.md`: useful but incomplete because `ak onboard` should also expose repo-native context.

## Consequences
- Future agents should run `ak onboard` and see this repo as a clean-start Next.js reader/account app.
- UI, auth, database, Mailpit, Playwright, and Drizzle are valid Astra concerns.
- Central Akashic warnings and playbooks still apply when relevant, but local Astra instructions are stricter for this repo.
