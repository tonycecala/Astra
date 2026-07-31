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
| AS-R-005 | medium | Report generation | A private evidence trace can cover every selected signal while clean rendered prose adds fabricated dialogue, invented biography, fixed fate/history, or contribution-ledger claims. | Tony + Cheyenne V3 clean-prose V1/V2 comparisons, 2026-07-31 | Validate semantic fidelity separately from ID coverage; prohibit fabricated quotes and concrete biography while treating imaginative metaphor as reviewable prose | open |

## Level 0 Escalations

None active from this docs rollout.

## Gate Inventory

- `.codex/config.toml`: present
- `.codex/hooks/akashic_preflight.py`: present
- PreToolUse gate: present
- Recommendation: keep current gate posture; do not install stronger blocking without Tony approval.
