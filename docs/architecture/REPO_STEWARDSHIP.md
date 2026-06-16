---
title: "Astra Repo Stewardship"
type: "repo-local-governance-pointer"
status: "active"
scope: "Astra"
canonical_protocol: "akashic/governance/AKASHIC_REPO_STEWARDSHIP_PROTOCOL.md"
created: "2026-06-16"
owner: "Tony"
repo: "Astra"
summary: "Local pointer and repo-specific stewardship entrypoint for Astra and Composer."
---

# Astra Repo Stewardship

This repo is governed by the Akashic Repo Stewardship Protocol v3:

`akashic/governance/AKASHIC_REPO_STEWARDSHIP_PROTOCOL.md`

Reporting levels are governed by Akashic Reporting Levels. Codex reports mostly at Levels 2-4; Level 0 is escalation only.

## Local Stewardship Docs

| File | Purpose |
|---|---|
| `docs/architecture/SYSTEM_MAP.md` | Repo shape, major modules, data flow, entry points |
| `docs/architecture/BOUNDARIES.md` | Subsystem ownership and forbidden coupling |
| `docs/architecture/RISK_REGISTER.md` | Known risks, fragile zones, mitigation status |
| `docs/architecture/REVIEW_CHECKLIST.md` | Repo-local review checklist using the Akashic protocol |
| `docs/progress/PROGRESS_LOG.md` | Durable progress memory |

## Reporting Defaults

- Level 2: Architecture Steward reviews for system boundaries, contracts, privacy, auth, persistence, and generation paths.
- Level 3: Workflow/QA reports for user journeys, stream behavior, report generation, and browser-visible verification.
- Level 4: Implementation/debug handoffs for files, routes, tests, and exact failures.
- Level 0: escalation only when implementation threatens Astra's private, personalized product promise, trust model, privacy model, economics, or strategic direction.

## Repo Notes

- Repo mission: build the Astra clean-start product with separated Astra and Composer surfaces.
- Primary systems: Next.js apps, Better Auth, Neon/Postgres, Drizzle, astrology/report generation packages, Composer stream artifacts.
- Existing architecture docs: `clean-start-foundation.md`, `composer-private-personal-feeds.md`, `local-dev-server.md`, and `stream-read-model-cache-boundary.md`.
- Gate posture: `.codex/config.toml`, `.codex/hooks/akashic_preflight.py`, and PreToolUse gates already exist. Do not install stronger blocking without Tony approval.

## Steward Review Triggers

Run a Steward review when work touches auth, private feeds, report generation, Composer stream contracts, database schema/repositories, app routes, credits/billing-adjacent behavior, generation pipelines, or user-visible navigation.
