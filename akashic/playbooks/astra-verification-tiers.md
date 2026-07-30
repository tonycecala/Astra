---
title: "Astra Verification Tiers"
type: "playbook"
description: "Select fast, focused, responsive, security, and release verification by changed boundary."
status: "active"
project: "astra"
updated: "2026-07-30"
tags: ["verification", "playwright", "performance"]
---

# Astra Verification Tiers

## Purpose

Keep feedback fast without weakening the proof required at production boundaries.

## Procedure

1. Identify the changed boundary using `docs/evaluations/ASTRA_VERIFICATION_TIERS.md`.
2. Run `npm run check:fast` for the normal edit loop.
3. Run the one affected Playwright group when browser behavior is in scope.
4. Run `npm run check` before committing executable changes.
5. Run `npm run test:e2e:release` before merging shared runtime, authentication, cross-route, or release-candidate changes.
6. Keep the OTP rate-limit suite isolated because proving the throttle intentionally exhausts its production window.

## Authenticated browser tests

Prove the real OTP contract once. Reuse Better Auth-signed test sessions for product journeys so authentication remains realistic without repeatedly consuming rate-limit capacity. Never expose a test-login API route and never disable production throttling.

## Review

Record the selected tier and why in closeout. If a relevant tier was omitted, state the boundary evidence that made it unnecessary.

For durable state transitions, first prove the action acknowledgement, then reload before asserting the persisted result. Do not make release acceptance depend on client revalidation timing.
