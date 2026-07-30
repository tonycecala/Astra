---
title: "Enforce Astra interface chrome through i18n"
type: "skill"
description: "Keep Astra interface chrome dictionary-driven without conflating UI labels with authored content or canonical values."
status: "active"
project: "astra"
created: "2026-07-30"
date: "2026-07-30"
updated: "2026-07-30"
timestamp: "2026-07-30"
okf_version: "0.1"
tags: ["skill", "captured"]
related: []
---
# Enforce Astra interface chrome through i18n

## Problem
Astra's dictionary contract is easy to erode with small raw JSX labels,
placeholders, select options, or disclosure summaries.

## Signals
- Alphabetic text appears directly in app/component JSX.
- An accessible-name attribute contains a literal string.
- `npm run check:i18n` reports a file, line, and literal.

## Root Cause
UI chrome and authored/runtime content can look identical in TSX even though
they have different ownership boundaries.

## Investigation
Classify each literal before editing: UI chrome belongs in
`apps/astra-web/lib/i18n.ts`; canonical form/API values, technical code samples,
and authored/generated content remain data.

## Resolution
Move UI labels into the existing dictionary and reference the dictionary at the
render boundary. Preserve stable form values when translating option labels.

## Prevention
Run `npm run check:i18n` after user-facing TSX changes. It also runs inside
`npm run check`.

## Related Files
- `apps/astra-web/lib/i18n.ts`
- `scripts/check-i18n-chrome.mts`
- `akashic/playbooks/astra-composer-product-design-patterns.md`

## Related ADRs
- None yet.
