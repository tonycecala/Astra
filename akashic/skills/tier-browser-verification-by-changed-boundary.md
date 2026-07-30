---
title: "Tier browser verification by changed boundary"
type: "skill"
description: "Akashic skill artifact."
status: "draft"
project: "astra"
created: "2026-07-30"
date: "2026-07-30"
updated: "2026-07-30"
timestamp: "2026-07-30"
okf_version: "0.1"
tags: ["skill", "captured"]
related: []
---
# Tier browser verification by changed boundary

## Problem
Use check:fast for the edit loop, run the one Playwright tag group that matches the changed boundary, and reserve the compact release matrix plus isolated security contracts for merge or release proof.

## Signals
The default validation loop is slower than the edit itself, or unrelated E2E
journeys run for a narrowly scoped change.

## Root Cause
Verification was selected as one monolithic checklist instead of by the product
or technical boundary that changed.

## Investigation
Measure each static command and browser group independently. Map each test to a
named boundary and tag browser tests by the contract they prove.

## Resolution
Use `npm run check:fast` while editing, the affected tagged browser group for
browser-visible behavior, and the compact release matrix before merge.

## Prevention
Review the change-to-test matrix before running broad validation. Add a tag only
when the test genuinely proves that boundary.

## Related Files
- `docs/evaluations/ASTRA_VERIFICATION_TIERS.md`
- `package.json`

## Related ADRs
- None yet.
