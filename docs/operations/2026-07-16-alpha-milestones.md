---
title: 2026-07-16 Astra Alpha Milestones
status: completed
type: release-ledger
project: Astra Clean Start
created: 2026-07-17
completed: 2026-07-17
audience: Tony, release stewards, and future implementation agents
---

# Astra Alpha Milestones: 2026-07-16

## Purpose

This is the durable record of the product and release work completed on 2026-07-16. It distinguishes the deployed alpha baseline, the release-safe report improvements awaiting promotion, and the deliberately unmerged free-report pilot.

## Deployed Alpha Baseline

`alpha` is the production branch for `https://alpha.astraportrait.com`.

- Created the separate Astra and Composer Vercel alpha projects, each pinned to `alpha` with isolated production configuration.
- Connected the alpha domain, isolated alpha Neon database, Resend delivery, Better Auth, beta Stars, and the Sonnet 5 production report profile.
- Added public Composer-backed logged-out cards with a seed fallback and kept Composer mutations private behind the internal token.
- Fixed sign-in/profile initialization concurrency and signed-out Library privacy boundaries.
- Completed Library scanning improvements: person/pair report naming, report-family labels, dates, historical Synastry partner names, and recovered partner birth-date metadata.
- Added portable Self, Ally, chart, and report data bundles for repeatable alpha data moves.

## Chart and Report Integrity

- Preserved report provenance as immutable basis snapshots: Natal, Progressed, or Synastry plus Zodiac and Houses settings.
- Applied settings to calculation, not merely labels, and surfaced compact provenance in Library.
- Repaired known saved birth-place coordinates and added a deliberate signs-and-aspects-only path when location is unavailable.
- Kept unknown-time restrictions explicit: Progressed requires a known birth time; Synastry avoids house/angle claims when time is unknown.
- Captured the future weighted chart-signal graph as a separate TODO instead of expanding the customer flow prematurely.

## Deep Report Quality and Economics

- Recovered the older Deep Report quality contract and comparison routine so improvements can be measured against prior work.
- Replaced one monolithic Deep response with a shared thesis plus section-level generation, controlled concurrency, targeted retry, deterministic assembly, and retained retry telemetry.
- Improved visible-output budgeting, narrowed false-positive prose gates, retained rejected prose for diagnosis, and made prose more plainspoken with shorter paragraph shape.
- Added report-quality, readability, repetition, latency, and cost evaluation routines; strengthened customer-facing Deep Report reader presentation.
- Ran model exploration across Sonnet, Gemini, Kimi, and Flash Lite. GLM Flash was retired from future testing after failing the bar. Production routing remains Sonnet 5; Gemini remains a comparison/fallback tool, not automatic customer routing.

## Release-Safe Promotion Set

The following current-branch commits are candidates for alpha promotion after the focused live acceptance pass:

- `1db398c` through `b67de2a`: Deep Report comparison, quality contract, section generation, retry telemetry, readability, paragraph presentation, birth-place integrity, and bakeoff tooling.

These changes improve the deployed product without adding a new first-time acquisition promise.

## Explicitly Excluded Pilot

Do **not** merge these commits into `alpha` as part of the limited-release promotion:

- `97cff99`, `f70389d`, `61af107`, `2f76ca3`, `3b36362`, `3cd45f6`

They implement and document the experimental first Self-chart free Identity Report. The desired product rule is clear, but the full live-alpha first-user journey has not yet been proven. Its acceptance brief is [ASTRA_FIRST_SELF_INTRO_REPORT_VERIFICATION.md](../inbox-astra/ASTRA_FIRST_SELF_INTRO_REPORT_VERIFICATION.md).

## Promotion Gate

Before promotion, prove the deployed `alpha` path with one focused user journey:

1. Logged-out home and public cards.
2. Email sign-in and one-time beta Stars grant.
3. Known birth date, time, and resolved place for Self.
4. Paid Identity Report generation using the production model profile.
5. Library reader and its Birth/Report Basis/Zodiac/Houses provenance.
6. Ally chart and paid Ally report ordering.
7. Phone navigation across Journey, Allies, Self, Library, and Gifts.

Promotion is complete only when the updated `alpha` deployment is Ready, `alpha.astraportrait.com` resolves to it, and the same core route smoke is clean in the deployed environment.

## 2026-07-17 Acceptance Evidence

The focused live-alpha pass completed before promotion with a fresh beta account:

- Logged-out Journey rendered four public Composer cards and exposed no private Self data.
- Email OTP sign-in established a real Alpha session for `tonycecala+testingname@gmail.com`.
- The first paid Identity Report order reduced the new account balance from the one-time 30-Star beta grant to 29 Stars.
- A Self chart with a known birth time and selected Chicago coordinates produced a completed paid Identity Report.
- The private Library reader rendered its Identity Report provenance, including Natal basis, Tropical Zodiac, and Whole Sign Houses.
- An Ally, known-time-and-place Ally chart, and paid Ally Identity Report order succeeded, leaving 28 Stars.
- All five bottom-navigation routes rendered at 390 by 844 without horizontal overflow.

The introductory free first-Self Identity Report was not invoked or promoted. It remains an independent pilot.
