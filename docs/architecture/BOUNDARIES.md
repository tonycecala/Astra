---
title: "Astra Subsystem Boundaries"
type: "repo-boundaries"
status: "draft"
scope: "Astra"
created: "2026-06-16"
owner: "Tony"
repo: "Astra"
report_level: "2 - Architecture Steward View"
summary: "Ownership boundaries, forbidden coupling, and responsibility rules for Astra."
---

# Astra Subsystem Boundaries

**Report Level:** 2 - Architecture Steward View

## Boundary Table

| Subsystem | Owns | Does Not Own | Forbidden Coupling |
|---|---|---|---|
| Astra UI/routes | User journeys, route handlers, visible states | Raw persistence mechanics | UI components directly owning database policy |
| Composer | Stream/content subassembly behavior | Astra private-user data ownership | Treating public Composer artifacts as private Astra state without review |
| Contracts | Shared typed shapes | Business workflows | Ad hoc duplicate interfaces in route/components |
| Database | Schema, repositories, migrations | UI and product copy | Persistence logic leaking into components |
| Auth/session | Identity and private-user access | Content generation details | Generation code assuming auth state without guards |
| Domain generation | Chart/report logic | Auth, billing, storage policy | Silent fallbacks for missing exact report/chart data |

## Silent Fallback Policy

When exact user, chart, stream, or report data is required, Astra should fail visibly or return typed empty/error states. Do not substitute sibling records, nearby snapshots, or generic public stream data for private personalized state.

## Current Boundary Risks

| Risk | Subsystem | Severity | Mitigation |
|---|---|---|---|
| Public/private data boundary can blur between Astra and Composer | Astra/Composer | high | Steward review for any stream/auth/storage changes |
| Report generation can hide missing contract data behind prose output | Generation/contracts | medium | Keep code-owned schemas and validation |
| UI route changes can look healthy from shell only | UI/dev server | medium | Use browser-visible QA for user journeys |
