---
title: "Astra System Map"
type: "repo-system-map"
status: "draft"
scope: "Astra"
created: "2026-06-16"
owner: "Tony"
repo: "Astra"
report_level: "2 - Architecture Steward View"
summary: "Current Astra/Composer repo shape, major subsystems, data flow, and entry points."
---

# Astra System Map

**Report Level:** 2 - Architecture Steward View

## Repo Mission

Astra is the clean-start product repo for private, personalized astrology/report experiences, with Composer as a related stream/content subassembly.

## Major Subsystems

| Subsystem | Owns | Does Not Own | Primary Files / Folders |
|---|---|---|---|
| Astra web app | User-facing Astra routes, APIs, onboarding/report flows | Database internals or generic generation policy | `apps/astra-web/` |
| Composer web app | Composer-specific stream/content surface | Astra private-user state ownership | `apps/composer-web/` |
| Contracts | Shared data shapes between apps/packages | Runtime persistence | `packages/contracts/` |
| Database | Schema, repositories, migrations, persistence rules | UI state or product copy | `packages/db/` |
| Astrology/report packages | Domain calculations and report assembly support | Auth/session policy | `packages/astrology/`, `packages/chart-maker/` |
| Akashic artifacts | Repo-local missions, warnings, decisions, inbox, REPOMAP | Production runtime logic | `akashic/` |

## Entry Points

| Entry Point | Purpose |
|---|---|
| `apps/astra-web/app/api/chart-requests/route.ts` | Chart request API |
| `apps/astra-web/app/api/reports/route.ts` | Report request/list API |
| `apps/astra-web/app/api/reports/[requestId]/generate/route.ts` | Report generation API |
| `apps/astra-web/app/api/composer/stream-artifacts/route.ts` | Composer stream artifact API |
| `package.json` | Dev, test, build, boundary, and database scripts |

## Data Flow

1. User-facing routes and API handlers receive Astra/Composer actions.
2. Contracts and repository packages define shared data shapes and persistence.
3. Domain packages produce chart/report-related outputs.
4. Apps render or publish user-visible stream/report results.
5. Akashic artifacts preserve local decisions, warnings, missions, and repo maps.

## External Services / Dependencies

| Service / Dependency | Purpose | Risk / Notes |
|---|---|---|
| Next.js / React | App surfaces and API routes | Browser-visible proof required for UI journeys |
| Better Auth | Auth/session behavior | Private-user contracts must stay explicit |
| Neon/Postgres + Drizzle | Persistence and schema management | Migration/schema changes require Steward review |
| Resend/Nodemailer | Email delivery | Auth and notification paths need failure-state proof |

## Active Architecture Questions

- Which Composer data is public versus private-user state?
- Which report generation contracts should be formalized before expansion?
- Which stream cache/read-model boundaries need additional tests?

## Level 0 Constraints

- Astra must preserve the private, personalized product promise.
- Public stream retrieval must not collapse into Astra private-user storage/auth boundaries without an explicit architecture decision.
