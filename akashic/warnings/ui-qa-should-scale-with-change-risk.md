---
title: "UI QA should scale with change risk"
type: "warning"
description: "Use browser-visible proof proportional to the change instead of defaulting every UI edit to the broadest QA suite."
status: "active"
project: "akashic"
created: "2026-07-16"
date: "2026-07-16"
updated: "2026-07-16"
timestamp: "2026-07-16"
okf_version: "0.1"
tags: ["warning", "qa", "browser", "risk"]
related: ["akashic/warnings/local-dev-server-tab-is-not-server-proof.md"]
---
# UI QA should scale with change risk

## What Happened
For Astra visual-only edits, choose the smallest evidence set that can falsify the likely regression. A local spacing or typography change should use the affected rendered state, the breakpoint crossed by the CSS, focused layout assertions, and lint/typecheck. Do not default to every route, viewport, browser, production build, payment flow, or full E2E suite unless the change actually touches those boundaries. Browser truth remains required, but breadth must be justified by blast radius rather than used as a completion performance.

## Why It Happened
Completion checklists can turn useful browser proof into ritual. A full route, viewport, and browser sweep feels thorough, but for a localized CSS change it adds time and noise without testing a plausible failure mode. This makes iteration slower and can obscure the evidence that actually matters.

## How To Avoid It
1. State the edited surface and the likely visual regression.
2. Test the exact rendered state that changed.
3. Add only the breakpoint, route, or journey needed to challenge that hypothesis.
4. Run broad suites when contracts, shared components, navigation, authentication, persistence, purchase flow, or cross-route behavior changed.
5. Record why each QA layer was selected. Do not use test breadth as a proxy for confidence.
