---
title: "Astra Risk Register"
type: "repo-risk-register"
status: "active"
scope: "Astra"
created: "2026-06-16"
owner: "Tony"
repo: "Astra"
report_level: "2 - Architecture Steward View"
summary: "Known risks, fragile zones, mitigation status, and review triggers."
---

# Astra Risk Register

**Report Level:** 2 - Architecture Steward View

## Active Risks

| ID | Severity | Area | Risk | Evidence | Mitigation | Status |
|---|---|---|---|---|---|---|
| AS-R-001 | high | Public/private boundary | Composer public stream data and Astra private-user data can be conflated. | Existing architecture docs and warnings | Steward review for stream/auth/storage changes | open |
| AS-R-002 | medium | Contracts | Report/chart/generation contracts can drift across packages and routes. | `packages/contracts/`, report APIs | Update contracts/docs/tests together | open |
| AS-R-003 | medium | Browser proof | Route/UI work can pass shell checks while failing in browser. | Local warnings and QA standard | Use rendered browser checks for affected journeys | open |
| AS-R-004 | low | Toolchain compatibility | TypeScript 7.0 has no programmatic API, while Next.js and `typescript-eslint` still import TypeScript. A direct replacement can break lint/build tooling. | TypeScript 7 benchmark and current peer ranges | Keep TS7 CLI and TS6 API side-by-side; remove TS6 only after dependent tooling explicitly supports the new API | monitoring |
| AS-R-005 | medium | Report generation | A private evidence trace can cover every selected signal while clean rendered prose adds fabricated dialogue, invented biography, fixed fate/history, or contribution-ledger claims. | Tony + Cheyenne V3 comparisons plus production V3 validation and retry smokes, 2026-07-31 | Production separates semantic fidelity from ID coverage, detects quoted/italicized fabricated speech and contextual technical leakage, snapshots rejected attempts privately, and fails after one corrective retry when boundaries or the fatal-category budget remain outside policy | monitoring |
| AS-R-006 | medium | Synastry editorial quality | The approved category-count policy can deterministically green-light a portrait that is reliable but not editorially clean when exactly two broad fatal categories remain. | Michelle V3.1 completed at 1,428 words with full trace and semantic review but retained `technical_surface` and `perspective_erasure`; 34.9 technical terms per 1,000 words across 10 heavy paragraphs | Report deterministic acceptance and editorial cleanliness separately; retain private metrics and use the next prompt iteration to reduce technical surface and strengthen second-person perspective without changing strongest-15 evidence or acceptance arithmetic without owner approval | monitoring |

## Level 0 Escalations

None active from this docs rollout.

## Gate Inventory

- `.codex/config.toml`: present
- `.codex/hooks/akashic_preflight.py`: present
- PreToolUse gate: present
- Recommendation: keep current gate posture; do not install stronger blocking without Tony approval.
