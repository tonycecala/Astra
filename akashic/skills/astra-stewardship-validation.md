---
title: "Astra Stewardship Validation"
status: "active"
date: "2026-06-16"
updated: "2026-06-16"
tags: ["skill", "astra", "akashic", "stewardship", "validation"]
related:
  - "../../docs/architecture/REPO_STEWARDSHIP.md"
  - "../../docs/architecture/SYSTEM_MAP.md"
  - "../decisions/ADR-20260610-astra-clean-start-local-posture.md"
---

# Astra Stewardship Validation

## Problem

Astra can look stewardship-ready after the local governance docs are installed while still leaving Akashic validation warnings unresolved.

## Signals

- `ak governance check` passes.
- `ak validate` reports missing local Akashic artifacts or schema gaps.
- The repo has stewardship docs but future agents do not have a local skill explaining the required validation loop.

## Root Cause

Governance checks and Akashic validation cover different layers. The governance gate verifies attention hooks and inbox posture; `ak validate` verifies the repo-local Akashic knowledge structure, including durable skills, decisions, and warnings.

## Investigation

Start with the smallest proof sequence:

1. Run `ak governance check` and resolve any active blockers before editing.
2. Run `ak validate` and treat warnings as unfinished AK work unless Tony explicitly approves an exception.
3. Inspect `docs/architecture/REPO_STEWARDSHIP.md`, `AGENTS.md`, and `akashic/repomaps/current.md` before changing product code.
4. Check `git status --short -uall` so validation fixes do not hide unrelated edits.

## Resolution

1. Keep Astra's `AGENTS.md` pointed at the canonical Akashic Stewardship v3 protocol.
2. Keep the local architecture doc set present under `docs/architecture/` and progress notes under `docs/progress/`.
3. Add real repo-specific Akashic artifacts when validation reports empty knowledge areas.
4. Refresh the repo map after structural documentation or Akashic artifact changes.
5. Re-run `ak validate`, `ak governance check`, and `ak repomap check` before committing.

## Prevention

For Astra AK work, do not stop at a passing governance check. The completion bar is a clean `ak validate`, clean governance check, current repo map, and a focused commit that future agents can understand without chat history.

## Related Files

- `AGENTS.md`
- `docs/architecture/REPO_STEWARDSHIP.md`
- `docs/architecture/SYSTEM_MAP.md`
- `docs/architecture/BOUNDARIES.md`
- `docs/architecture/RISK_REGISTER.md`
- `docs/architecture/REVIEW_CHECKLIST.md`
- `docs/progress/PROGRESS_LOG.md`
- `akashic/repomaps/current.md`

## Related ADRs

- `akashic/decisions/ADR-20260610-astra-clean-start-local-posture.md`
