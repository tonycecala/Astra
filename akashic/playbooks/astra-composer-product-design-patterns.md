---
title: Astra and Composer Product Design Patterns
type: playbook
description: Product design pattern guidance for Astra and Composer user-facing flows.
status: active
project: astra
tags:
  - astra
  - composer
  - product-design
  - playbook
source_import: ../imports/astra-product-design-pattern-library/
created: 2026-06-16
updated: 2026-08-01
timestamp: 2026-08-01
---

# Astra and Composer Product Design Patterns

Use this playbook before changing Astra or Composer user-facing flows, especially Stream, Self, chart onboarding, Library, reports, artifacts, sandbox, discovery, personalization, paywall, sharing, and public/private data boundaries.

The full source library is filed at:

- `akashic/imports/astra-product-design-pattern-library/source-library/`
- `akashic/imports/astra-product-design-pattern-library/source-zip/`

## North Star

Astra should become a meaningful daily companion, not a gamified astrology toy.

Optimize for:

- Meaning.
- Insight.
- Reflection.
- Growth.
- Durable usefulness.
- Calm return.

Do not optimize for:

- Addiction.
- Compulsive checking.
- Fake urgency.
- Opaque personalization.
- Engagement loops that would feel embarrassing if explained plainly.

## Required Design Review

For any user-facing Astra or Composer change:

1. Name the relevant pattern files from `source-library/patterns/`.
2. State the user outcome the change improves.
3. Account for logged-out, empty, loading, success, error, and mobile states.
4. Name any analytics events or explicitly state that the slice has no analytics surface yet.
5. Check the dark-pattern guardrails in `source-library/audits/ASTRA_DARK_PATTERN_GUARDRAILS.md`.
6. Keep UI copy outcome-focused and route it through Astra i18n where it is app chrome.

## Adopt First

Prioritize these patterns for near-term Astra and Composer work:

- `01-time-to-value.md`
- `02-sandbox-experience.md`
- `03-discovery.md`
- `04-personalisation.md`
- `05-progressive-disclosure.md`
- `06-setup-defaults.md`
- `07-empty-states.md`
- `08-success-moments.md`
- `09-value-replay.md`
- `10-effort-moat.md`
- `13-intent-mirroring.md`
- `15-pattern-alignment.md`
- `20-fail-safe.md`
- `36-trust-building.md`

## Adapt Carefully

These can help, but only through a humane, non-extractive lens:

- `14-momentum-bias.md`
- `19-intentional-friction.md`
- `21-permission-serve.md`
- `22-system-widget.md`
- `24-shareability.md`
- `27-gamified-progress.md`
- `28-variable-reward.md`
- `29-spark-curiosity.md`
- `35-growth-viral.md`

Treat them as clarity or continuity tools, not retention tricks.

## Avoid Or Defer

Avoid these unless a later product decision explicitly justifies them:

- `26-contact-bridge.md`
- `31-limited-offer.md`
- Aggressive versions of `30-the-paywall.md`
- Any fake scarcity, guilt streak, fear-based astrology copy, hidden data collection, or unexplained personalization.

## Immediate Product Impact

For the current Astra path, this changes the priority lens:

- The current `/self` chart request panel is acceptable as a technical smoke path, but future birth-data capture should become a multi-step onboarding flow using Time to Value, Progressive Disclosure, Setup Defaults, Fail Safe, and Trust Building.
- Birth date remains the minimum. Birth time, timezone, and location should travel as one optional precision bundle, with plain copy explaining what improves when the user provides it.
- Question, intent, and context stay optional. Composer should use them as intent-mirroring inputs when present, never as required friction.
- Composer stream cards should include or be derived from a clear "why this appears now" rationale before personalization becomes sophisticated.
- Stream should move toward Insight -> Action -> Artifact -> Replay -> Discovery -> Return. Avoid a feed that only produces disposable cards.
- A no-auth sandbox should move up the roadmap after chart-maker and Composer boundaries are stable, because it is the strongest Time to Value path without compromising private data.
- Analytics should be planned as a small contract, not scattered literals. Use `source-library/metrics/ASTRA_PATTERN_ANALYTICS_EVENTS.md` as the naming base.

## Composer-Specific Rules

Composer composes. It should not own user identity, private profile policy, chart computation, or Astra routing decisions.

Composer should:

- Validate voice, tone, and safety before publishing an artifact.
- Preserve the source intent enough for Astra to explain the card.
- Avoid spiritual authority tone, moralizing, doom framing, or overclaimed accuracy.
- Produce artifacts Astra can replay in Library or Stream.
- Keep public stream envelopes separate from private user data.

## Astra-Specific Rules

Astra renders and governs the user journey.

Astra should:

- Make personalization explainable at the UI boundary.
- Keep public Composer artifacts and private user records on separate auth/storage paths.
- Prefer progressive disclosure over long forms.
- Give users undo, edit, delete, or re-run paths where personal data and artifacts are involved.
- Use i18n for app UI handles, labels, empty states, and errors.

## i18n Chrome Enforcement

Route all visible interface chrome through `apps/astra-web/lib/i18n.ts`,
including headings, labels, placeholders, select-option labels, disclosure
summaries, empty/loading/error text, and accessible-name attributes. Keep
canonical form values, API identifiers, technical `<code>` samples, and
authored or generated report content literal when they are data rather than UI
chrome.

Run `npm run check:i18n` after user-facing TSX changes. The guard scans Astra
routes and components for raw alphabetic JSX text and raw accessible-name
attributes, and it is part of `npm run check`. Treat a reported literal as a
design-boundary question before adding an exception.

## Review Question

Before shipping, ask:

Would this still feel respectful if Astra explained exactly what it is doing and why?

If the answer is no, redesign it.

## Long Mobile Choice Forms

When the user must scroll through a long set of choices before acting, keep the primary action in a compact fixed bar immediately above Astra's bottom navigation. Hide the duplicate top action on phone, reserve enough scroll padding to keep the final controls readable, and remove the fixed bar when confirmation opens. Keep supporting descriptions short enough that the decision labels, prices, and required follow-up controls remain the visual priority. Verify the action stays in the phone viewport after scrolling to the final choice.

## Allies List, Chart, And Report Separation

Treat Allies management, chart inspection, and report creation as separate user intents:

1. The default Allies surface is a calm list with one explicit `Add an Ally` action. Do not render report creation by default.
2. Adding an Ally captures identity and birth details, persists the private Ally chart, and returns to the list without creating or charging for a report.
3. Opening an Ally chart shows one chart, keeps Allies as the active navigation owner, and provides `Back to Allies`. Do not repeat the Allies or charts list beside the detail.
4. `Create Report` is an explicit action for one saved Ally chart. Skip completed identity and birth-data steps, name the Ally in the heading, and preserve the existing report confirmation and private ownership boundary.
5. Cover default, empty, add, chart-detail, report, invalid-chart, logged-out, success, and API-error states. Verify desktop, tablet, and mobile navigation, overflow, console health, and the absence of a report request after Add Ally.

Use `05-progressive-disclosure.md`, `07-empty-states.md`, `13-intent-mirroring.md`, `15-pattern-alignment.md`, `23-deep-link.md`, `32-jtbd-copywriting.md`, and `36-trust-building.md`. Runtime analytics are N/A until Astra has an analytics transport; when one exists, document `empty_state_cta_clicked` for the empty-state add action and a project-contract deep-link event for chart detail entry.

## Self Report Action Disclosure

When Self already has a saved chart, default `Request Report` to Step 1, Birth details. Do not expose the final `Order Report` action on default arrival; show it only after the user explicitly advances into Report or follows the `start=report` deep link. Keep first-chart onboarding and logged-out behavior unchanged. This applies Progressive Disclosure, Setup Defaults, Intent Mirroring, and Trust Building; runtime analytics remain N/A until Astra has an analytics transport.
