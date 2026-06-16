---
title: "Astra Review Checklist"
type: "repo-review-checklist"
status: "active"
scope: "Astra"
created: "2026-06-16"
owner: "Tony"
repo: "Astra"
summary: "Repo-local Steward and Builder review checklist derived from the Akashic Repo Stewardship Protocol v3."
---

# Astra Review Checklist

Every substantial review must declare report level, audience, scope, and escalation.

## Steward Review

- Level 2: verify app/package/database/auth/generation boundaries.
- Level 3: verify user journey and QA flow, including browser-visible evidence for UI work.
- Level 4: inspect exact files, routes, tests, and errors only when needed.
- Check private/public data boundaries before stream, auth, report, or storage changes.
- Confirm contracts, runtime guards, and tests move together.
- Confirm no silent fallback for missing user/chart/report/stream data.
- Update `RISK_REGISTER.md` and `PROGRESS_LOG.md`.

## Builder Completion

- Report changed behavior and tests run.
- Include exact files only after a short plain-English digest.
- Keep Level 0 out of routine engineering summaries unless real mission/trust/privacy risk appears.
- Do not install stronger hooks/gates without approval.
