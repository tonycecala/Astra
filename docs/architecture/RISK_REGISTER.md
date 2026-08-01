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
| AS-R-002 | medium | Contracts | Report/chart/generation contracts, including per-family writer policy and prompt-layer scope, can drift across packages, routes, and hosted configuration. | `packages/contracts/`, report APIs, model strategy, Core/Deep Evidence-to-Prose fixtures | Update contracts/docs/tests together; regression-test every prompt shape for each approved family and explicit exclusions; preserve family-specific provenance; keep a global hosted writer override unset unless an owner explicitly approves a temporary replay. | open |
| AS-R-003 | medium | Browser proof | Route/UI work can pass shell checks while failing in browser. | Local warnings and QA standard | Use rendered browser checks for affected journeys | open |
| AS-R-004 | low | Toolchain compatibility | TypeScript 7.0 has no programmatic API, while Next.js and `typescript-eslint` still import TypeScript. A direct replacement can break lint/build tooling. | TypeScript 7 benchmark and current peer ranges | Keep TS7 CLI and TS6 API side-by-side; remove TS6 only after dependent tooling explicitly supports the new API | monitoring |
| AS-R-005 | medium | Report generation | A private evidence trace can cover every selected signal while clean rendered prose adds fabricated dialogue, invented biography, fixed fate/history, or contribution-ledger claims. | Tony + Cheyenne V3 comparisons plus production V3 validation and retry smokes, 2026-07-31 | Production separates semantic fidelity from ID coverage, detects quoted/italicized fabricated speech and contextual technical leakage, snapshots rejected attempts privately, and fails after one corrective retry when boundaries or the fatal-category budget remain outside policy | monitoring |
| AS-R-006 | low | Synastry editorial quality | The approved category-count policy can deterministically green-light a portrait that is reliable but not editorially clean when exactly two broad fatal categories remain. | Michelle V3.1.1 completed at 1,438 words with 15/15 paragraph traces and semantic review; technical density fell from 49 to 13 terms, 34.9 to 8.8 terms per 1,000 words, and 10 to 3 heavy paragraphs; every paragraph addressed `you`, and Tony accepted the occasional-aspect balance | Preserve the psychology-first occasional-aspect prompt, paragraph-level second-person check, first-name Ally check, private metrics, and separate deterministic/editorial closeout; do not tighten prose through corrective quotas without owner approval | mitigated-monitoring |

## Level 0 Escalations

None active from this docs rollout.

## Gate Inventory

- `.codex/config.toml`: present
- `.codex/hooks/akashic_preflight.py`: present
- PreToolUse gate: present
- Recommendation: keep current gate posture; do not install stronger blocking without Tony approval.
