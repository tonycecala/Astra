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

## Level 0 Escalations

None active from this docs rollout.

## Gate Inventory

- `.codex/config.toml`: present
- `.codex/hooks/akashic_preflight.py`: present
- PreToolUse gate: present
- Recommendation: keep current gate posture; do not install stronger blocking without Tony approval.
