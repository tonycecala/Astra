---
title: "Astra Birth Date and Time UX Implementation Plan"
type: "implementation-plan"
status: "completed"
project: "astra"
created: "2026-06-28"
updated: "2026-07-15"
completed: "2026-06-27"
archived: "2026-07-15"
completion_commit: "f996568"
tags:
  - astra
  - birth-data
  - onboarding
  - ux
  - qa
source_prompt: "docs/inbox-astra/completed/astra-birth-date-time-ux-codex-prompt.md"
mobbin_reference: "https://mobbin.com/screens/297f6f2f-3444-4e5d-af4b-519295a310e9"
---

# Astra Birth Date and Time UX Implementation Plan

## Goal

Ship a reusable Apple-inspired birth date and time sheet for Astra that replaces the current plain birth-details inputs in Self and Ally chart onboarding, while preserving the existing chart request flow, private user boundary, and report-generation path.

The user outcome is simple: entering the birth moment should feel calm, precise, and trustworthy, with date, time, timezone, location, and unknown-time handling explained clearly before Astra creates or edits a chart request.

## Current State

- The completed design prompt is archived at `docs/inbox-astra/completed/astra-birth-date-time-ux-codex-prompt.md`.
- Existing birth intake lives mainly in `apps/astra-web/components/BirthOnboardingPanel.tsx`.
- Existing UI copy lives in `apps/astra-web/lib/i18n.ts`; new labels, errors, aria text, and helper copy must go there.
- Existing contract lives in `packages/contracts/src/index.ts`.
- `chartBirthDataSchema` currently requires `date` and allows optional `time`, `timezone`, `location`, `latitude`, and `longitude`.
- Current contract rule: if any precision detail is present, `time`, `timezone`, and `location` must all be present.
- Existing data is persisted as JSONB in `packages/db/src/schema.ts`; avoid a migration unless the final contract truly needs one.
- Existing route path is authenticated `/self#self-birth-onboarding` for Self and `/allies#ally-birth-onboarding` for Allies.

## Design Pattern Basis

Use the linked Mobbin/Apple Photos "Adjust Date and Time" screen as the interaction reference:

- [Mobbin reference](https://mobbin.com/screens/297f6f2f-3444-4e5d-af4b-519295a310e9)

Required Astra pattern files:

- `akashic/imports/astra-product-design-pattern-library/source-library/patterns/01-time-to-value.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/patterns/04-personalisation.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/patterns/05-progressive-disclosure.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/patterns/06-setup-defaults.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/patterns/10-effort-moat.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/patterns/20-fail-safe.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/patterns/36-trust-building.md`

Guardrail file:

- `akashic/imports/astra-product-design-pattern-library/source-library/audits/ASTRA_DARK_PATTERN_GUARDRAILS.md`

Analytics file:

- `akashic/imports/astra-product-design-pattern-library/source-library/metrics/ASTRA_PATTERN_ANALYTICS_EVENTS.md`

Analytics decision for this slice: document whether `birth_data_sheet_opened`, `birth_data_sheet_saved`, and `birth_data_unknown_time_enabled` should be added now, or explicitly mark analytics N/A if Astra does not yet have a stable analytics sink.

## Implementation Plan

1. Start cleanly.
   - Stay on a dedicated branch such as `codex/astra-birth-date-time-ux`.
   - Run `ak governance check`, `ak doctor`, and `ak dirty`.
   - Preserve the current dirty prompt/image files unless Tony explicitly asks to include or discard them.

2. Lock the contract before UI work.
   - Inspect `chartBirthDataSchema`, chart-maker consumers, report display helpers, and astrology calculation assumptions.
   - Prefer adding an optional `birthTimeKnown?: boolean` or equivalent metadata into `chartBirthDataSchema`.
   - For unknown time, keep the stored display contract honest: do not pretend a noon fallback is a known birth time.
   - If calculation requires noon, use a clearly named internal fallback at calculation time or context level, and preserve `birthTimeKnown: false` for UI/report copy.
   - Keep timezone explicit whenever exact time is known.
   - Decide whether date-only historical records remain valid for old requests, then cover that in tests.

3. Build the reusable sheet.
   - Add a small component such as `apps/astra-web/components/BirthDateTimeSheet.tsx`.
   - Add a focused stylesheet such as `apps/astra-web/components/BirthDateTimeSheet.module.css`.
   - Add small date helpers either inside the component file or in a nearby helper file only if tests need direct import.
   - No heavy date-picker dependency.
   - Include: sheet header, close button, context CTA, current/selected summary card, month grid, previous/next month controls, time pill/control, timezone row, unknown-time toggle, calm inline errors, and helper consequence copy.
   - Use lucide icons for close, arrows, clock, globe/timezone, and chevrons where helpful.

4. Wire it into existing onboarding without rewriting the flow.
   - Replace the plain date/time/timezone controls in `BirthOnboardingPanel.tsx` with an "Edit birth moment" entry point plus the sheet.
   - Preserve existing subject, report type, chart settings, place search, report confirmation, and recent request rail behavior.
   - Self uses CTA language like `Continue`; editing existing chart data can use `Save`.
   - Ally flow reuses the same sheet and copy variations through props, not a forked component.

5. Keep UI text in i18n.
   - Add all visible sheet labels, helper text, validation messages, aria labels, and empty/unknown-time copy to `apps/astra-web/lib/i18n.ts`.
   - Do not hardcode app chrome in route/component bodies except generated date values and user-authored data.

6. Validate states.
   - Logged out: `/self` and `/allies` still show the expected auth-required experience, no private data leakage.
   - Empty/new chart: sheet opens with browser timezone default and no selected date.
   - Loading/searching: place search still works and does not fight the sheet.
   - Success: selected date/time/timezone/location appears in review and saved chart request.
   - Error: missing date, future date, missing time with known-time enabled, and missing timezone show calm inline errors.
   - Unknown time: exact time control de-emphasizes, validation allows save, and review/report copy marks approximation.

7. Test and verify.
   - Add focused tests for calendar helper behavior if the repo has a suitable unit pattern.
   - Update `apps/astra-web/e2e/foundation-routes.spec.ts` for the Self onboarding path.
   - Add or update Ally coverage if the changed path reaches `/allies#ally-birth-onboarding`.
   - Run: `npm run lint`, `npm run typecheck`, targeted chart/onboarding tests, `npm run check:boundaries`, `npm run check:no-supabase`, `npm run build`.
   - Use `astra-browser-qa`: start the durable dev server, verify desktop/tablet/mobile, click through Self birth onboarding, Ally birth onboarding, calendar navigation, unknown-time toggle, timezone selection, review, and report confirmation.

## Acceptance Criteria

- Reusable birth date and time sheet exists and is used by Self and Ally onboarding.
- Future dates are impossible to save.
- Month navigation preserves selected date.
- Time is stored in normalized `HH:mm` form when known.
- Unknown birth time is first-class, validated, and represented in saved data or context.
- Timezone is explicit and normalized to IANA where available.
- No Supabase carryover is introduced.
- No new heavy date-picker dependency is introduced.
- UI copy flows through i18n.
- Browser-visible QA covers `/self#self-birth-onboarding` and `/allies#ally-birth-onboarding` on desktop and mobile, with tablet if layout changed materially.

## Historical Next Goal Prompt

```text
Implement the Astra birth date and time UX from docs/inbox-astra/completed/astra-birth-date-time-ux-implementation-plan.md and docs/inbox-astra/completed/astra-birth-date-time-ux-codex-prompt.md.

Start from a fresh branch named codex/astra-birth-date-time-ux. Run ak governance check, ak doctor, and ak dirty first. Preserve the existing prompt/image dirty files unless they are intentionally included in the final commit.

Use the Mobbin reference https://mobbin.com/screens/297f6f2f-3444-4e5d-af4b-519295a310e9 as the design anchor, and use these Astra pattern files before coding: 01-time-to-value, 04-personalisation, 05-progressive-disclosure, 06-setup-defaults, 10-effort-moat, 20-fail-safe, and 36-trust-building, plus the dark-pattern guardrails and analytics event contract.

Build a reusable Apple-inspired Birth Date and Time sheet for Self and Ally chart onboarding. Keep all app UI text in i18n. Preserve existing chart creation/report flows. Make unknown birth time explicit and honest in the data contract. Do not add a heavy date-picker dependency. Do not introduce Supabase carryover.

Completion requires lint, typecheck, affected tests, no-Supabase and boundary checks, production build, and astra-browser-qa browser verification of Self and Ally birth onboarding on desktop and mobile, including calendar navigation, unknown-time behavior, timezone selection, review, and report confirmation.

Final report should be concise: what changed, items to present with commands/routes/journeys/boundaries/issues fixed, recommended route/action to review, and a new next-goal prompt for the following chat.
```
