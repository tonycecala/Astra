---
title: "Astra Verification Tiers"
type: "playbook"
description: "Select fast, focused, responsive, security, and release verification by changed boundary."
status: "active"
project: "astra"
updated: "2026-07-31"
tags: ["verification", "playwright", "performance"]
---

# Astra Verification Tiers

## Purpose

Keep feedback fast without weakening the proof required at production boundaries.

## Procedure

1. Identify the changed boundary using `docs/evaluations/ASTRA_VERIFICATION_TIERS.md`.
2. Run `npm run check:fast` for the normal edit loop.
3. Run the one affected Playwright group when browser behavior is in scope.
4. Run `npm run check` before committing broad or production-boundary executable changes. Do not treat every executable edit as release work.
5. Run `npm run test:e2e:release` before merging shared runtime, authentication, cross-route, or release-candidate changes.
6. Keep the OTP rate-limit suite isolated because proving the throttle intentionally exhausts its production window.

## Authenticated browser tests

Prove the real OTP contract once. Reuse Better Auth-signed test sessions for product journeys so authentication remains realistic without repeatedly consuming rate-limit capacity. Never expose a test-login API route and never disable production throttling.

## Review

Record the selected tier and why in closeout. If a relevant tier was omitted, state the boundary evidence that made it unnecessary.

Verification must be proportional to the changed boundary and the claim being made:

- Documentation, comments, copy, and other non-executable edits usually need only diff inspection and format or link checks relevant to the file.
- Small, isolated logic edits usually need targeted lint, typecheck, and the affected test—not an automatic full-repository build or browser sweep.
- Tests and private experiments should prove the experiment harness, fixtures, assertions, privacy boundary, and observed result. They do not require production verification when they do not change production behavior.
- CSS and visual-only edits need fast rendered-browser inspection at the affected viewport plus a targeted smoke check. Save broad lint, typecheck, build, and route sweeps for settled checkpoints or when the edit crosses component, navigation, accessibility, or responsive-layout boundaries.
- Full `npm run check`, production build, release E2E, and broad route verification belong to shared runtime, contracts, auth, persistence, public/private boundaries, cross-route behavior, release candidates, or any change whose blast radius is genuinely broad.

More verification is not automatically more responsible. Choose the smallest evidence set that can falsify the likely failure, and escalate only when the changed boundary or failed evidence justifies it.

For durable state transitions, first prove the action acknowledgement, then reload before asserting the persisted result. Do not make release acceptance depend on client revalidation timing.

## Private shadow-generation bakeoffs

Use a private shadow-generation bakeoff when the question is editorial or model-behavioral and does not require a product-path change.

1. Read saved source records without inserting or updating production data.
2. Require an explicit `--generate` flag and pin the current approved writer.
3. Duplicate every production provider control that affects output, including temperature and reasoning effort. Record any intentional scope-driven difference, such as a larger completion-token limit for a longer experimental structure; never omit a provider control silently.
4. Write the prompt, source IDs, raw output, latency, usage, cost, hashes, and deterministic validation into a private ignored artifact directory with `0600` files.
5. Retain failed attempts beside the accepted attempt; do not silently replace evidence.
6. Run targeted lint, typecheck, and executable harness checks when the experiment adds code. Add `npm run check` only when the experiment changes shared runtime or another broad production boundary. Browser E2E is not required when no route, runtime, database write, or product prompt changes.
7. Refresh REPOMAP and the incremental JCodeMunch index at closeout. If JCodeMunch cannot index the experiment's file type, report the exact limitation and use REPOMAP plus targeted source validation rather than calling the index current for that file.

For a new report architecture, prefer direct chart-signal generation over feeding prior report prose back into the writer. Persist source chart IDs, the exact calculated signal packet, and `sourceReportIds: []` in the private manifest. Treat a selected signal packet as affirmative evidence, not an exhaustive chart: the writer must not infer that unlisted contacts are absent or use omissions to rank which person contributes more.

When comparing ranked evidence with a complete calculated inventory, define the editorial question before the paid call and keep model, structure, privacy, and provider controls fixed. Blind the portrait labels before editorial scoring, then reveal the mapping and reconcile that judgment with evidence density, repetition, named-perspective balance, cost, and latency. Treat completeness as an audit surface, not an automatic writer improvement: reject prose that turns contact counts into a contribution ledger, and verify that the writer does not reverse which person's natal bodies form a contact.
