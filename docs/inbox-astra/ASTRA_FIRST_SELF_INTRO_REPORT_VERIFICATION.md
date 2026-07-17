---
title: First Self Chart Introductory Identity Report Verification
status: active
type: future-verification-brief
project: Astra Clean Start
author: Tony + Codex
created: 2026-07-16
priority: P1
audience: Codex / engineering agents
mission: Prove the first completed Self chart automatically produces one free Identity Report and a satisfying first Library experience.
---

# First Self Introductory Report Verification

## Product Rule

When a person completes their first Self chart with valid birth data, Astra should automatically create one free **Identity Report**, then take them directly to that report in Library. There is no checkbox, model name, report picker, or purchase confirmation in this first-chart path.

## What Is Already Implemented

- The first Self-chart report step displays compact Zodiac and Houses controls plus `Create My Chart`.
- The server accepts the zero-Star grant only for a first Self natal Identity report and persists `modelPilot: kimi-intro-identity` with the report request.
- Repeated introductory grants and non-Identity use are rejected server-side.
- Later Self charts retain the ordinary paid report ordering flow.

## Verification Gap

The focused browser regression verifies the first-run screen and its simplified controls without calling an external writing model. A one-off live browser attempt was stopped before it reached the chart request, so it is not evidence of a completed live intro report.

Do not infer a model or Library result from that interrupted attempt.

## Smallest Next Run

1. Use a fresh synthetic account in the actual alpha deployment, not the local developer server.
2. Enter a known birth date, time, and selected place.
3. Select `Create My Chart`.
4. Confirm exactly one Identity Report appears in Library, costs 0 Stars, and opens automatically.
5. Confirm its provenance plate shows Natal, Zodiac, Houses, and the saved birth location.
6. Repeat only the final request action and confirm a second free report is refused; no duplicate grant or debit may occur.
7. Record the report ID, elapsed time, browser console errors, and the exact customer-facing failure state if generation fails.

## Acceptance

- The new user sees no free-offer control or technical model naming.
- The completed report is immediately readable and clearly labeled as an Identity Report for that person.
- The balance is unchanged by the free report.
- The report basis and settings are immutable and visible in Library.
- The customer gets a recoverable status message if generation fails rather than a stalled onboarding screen.

## Boundary

This is a narrow alpha verification task. Do not add a report-management screen, retries UI, or new purchase logic unless the live run exposes a concrete fault.
