---
title: Astra Codex Guardrails - V1 Quarry Is Source of Truth
status: active
type: codex-inbox-directive
project: Astra Clean Start
author: Tony + AVA
created: 2026-06-23
priority: P0
audience: Codex / engineering agents
mission: Prevent unnecessary rewrites and restore v1 chart-report-library parity by quarrying v1 first.
---

# Astra Codex Guardrails: V1 Quarry Is Source of Truth

## Job 1

Restore Astra Clean Start to **v1 functional and visual parity** for the core product loop:

```text
Self / Ally birth data
  -> normalized chart generation
  -> LLM report generation
  -> v1-quality report rendering
  -> Library artifact storage
  -> Library detail view
```

This is the current engineering priority.

Do not widen scope until this loop works end-to-end for both:

1. **Self**
2. **Ally**

## Prime directive

**Do not invent new Astra product behavior when v1 already solved it.**

For all chart, report, interpretation, rendering, styling, prompt, scoring, library, and user-flow work:

> v1 is the source of truth unless it is explicitly Supabase-auth-specific or incompatible with the clean-start architecture.

The clean start is not permission to redesign Astra from scratch.

The clean start exists to remove obsolete infrastructure, reduce coupling, modularize the system, and preserve the parts of v1 that already worked.

## What must be quarried from v1

Codex must search v1 before writing new implementations for:

- Birth data collection UX
- Birth data validation and normalization
- Chart calculation pipeline
- Self chart generation
- Ally chart generation
- Report generation flow
- Report prompt structure
- Report narrative plan structure
- Report section/domain structure
- Report visual design
- Report typography and layout
- Library artifact model
- Library list behavior
- Library detail behavior
- Existing smoke/e2e test expectations
- Any existing chart/report parity fixtures

## What must NOT be quarried from v1

Do not copy or preserve:

- Supabase Auth implementation
- Supabase session assumptions
- Supabase RLS/user role assumptions
- Legacy database coupling that conflicts with the clean-start Neon/Drizzle/Better Auth architecture
- Dead PNG/assets/demo clutter
- Obsolete migration baggage
- Any old implementation that only exists to work around Supabase-era limitations

## Required operating rule before new code

Before implementing any non-trivial chart/report/library behavior, Codex must produce a short quarry note in the working response or commit summary:

```text
V1 Quarry Note
- Searched v1 for: <feature/behavior>
- Found source files: <paths>
- Reused: <specific logic/components/styles/contracts>
- Adapted because: <clean-start/i18n/no-Supabase reason>
- New code justified because: <only if v1 was absent or incompatible>
```

If Codex cannot name the v1 files searched, Codex has not searched v1.

If Codex cannot explain why new code is necessary, Codex should not write new code.

## Rewrite budget

New implementation is allowed only when one of these conditions is true:

| Condition | Allowed? | Requirement |
|---|---:|---|
| v1 code is Supabase-auth-specific | Yes | Preserve behavior, replace auth/session plumbing |
| v1 code is tightly coupled to removed database shape | Yes | Preserve contract and UX, adapt persistence |
| v1 behavior is missing | Yes | Implement minimally, with tests |
| v1 behavior is unclear | Maybe | Inspect more v1 files first |
| Codex prefers a cleaner abstraction | No | Quarry v1 first |
| Codex thinks greenfield is faster | No | Quarry v1 first |
| Codex wants to modernize unrelated code | No | Not Job 1 |
| Codex wants to redesign UX | No | Restore v1 parity first |

## No invention zones

Until chart-report-library parity exists, Codex must not redesign or newly invent:

- Report visual language
- Report content structure
- Report section order
- Chart calculation semantics
- Interpretation evidence rules
- Library artifact semantics
- Core birth-data wizard journey
- The relationship between Self, Ally, Report, and Library

Small clean-start adaptations are allowed. Product reinvention is not.

## Parity definition

A feature is not done merely because it compiles.

A feature is done when the clean-start implementation matches v1 behavior closely enough that Tony would recognize the same Astra returning in a cleaner body.

Minimum parity gates:

1. **Self chart can be generated** from normalized birth data.
2. **Ally chart can be generated** from normalized birth data.
3. **LLM report can be generated** from the calculated chart using the v1 report logic/prompt/report structure as source of truth.
4. **Report is stored as a Library artifact** using clean-start persistence.
5. **Library list shows the report** with correct title/type/date ownership.
6. **Library detail view renders the report** with v1-level visual quality.
7. **Tests prove the loop works** for Self and Ally.
8. **No Supabase Auth assumptions remain.**
9. **i18n remains compatible** and does not get bypassed by hardcoded user-facing strings without justification.

## Required tests

Codex must add or preserve tests that prove:

- Birth data normalization works for Self.
- Birth data normalization works for Ally.
- Chart generation returns stable, expected chart payloads.
- Report generation can run from chart payloads.
- Report persistence creates a Library artifact.
- Library list includes generated reports.
- Library detail renders the stored report.
- Self and Ally reports remain distinct and correctly owned.
- Removed Supabase auth/session assumptions do not reappear.

Prefer small, targeted tests over giant brittle ceremonies.

## Visual parity rule

The v1 report style was excellent.

Clean Start must restore that quality before adding new visual experiments.

Codex must inspect v1 report components/styles before creating or replacing:

- Report cards
- Report detail layout
- Section typography
- Spacing rhythm
- Background treatments
- Print/export styling if present
- Mobile report rendering

If Codex changes the visual language, it must explicitly explain why the v1 style could not be reused.

## Contract rule

Clean-start contracts may be improved, but they must preserve v1 product semantics.

Contracts should clarify and stabilize:

- `BirthData`
- `NormalizedBirthData`
- `ChartPayload`
- `ReportRequest`
- `ReportResult`
- `LibraryArtifact`
- `SelfSubject`
- `AllySubject`

Do not use contracts as an excuse to invent a different product.

## Route rule

Routes should serve the restored flow, not distract from it.

Preferred user-facing route intent:

```text
/self            -> Self profile and chart/report entry
/allies          -> Ally list and chart/report entry
/library         -> Artifact list
/library/[id]    -> Report/detail artifact view
```

Additional wizard subroutes are allowed only if they simplify the user journey and keep the flow obvious.

## i18n rule

Astra Clean Start includes i18n.

Codex may adapt v1 user-facing strings into translation keys, but must preserve the meaning and tone unless the text was clearly placeholder or obsolete.

Do not block parity on perfect translation architecture.

Use the smallest clean implementation that keeps user-facing strings ready for i18n.

## Anti-drift checklist

Before committing, Codex must answer:

- Did I inspect v1 for this feature?
- Did I reuse the v1 source of truth where possible?
- Did I avoid Supabase Auth carryover?
- Did I avoid unnecessary redesign?
- Did I keep Self and Ally both working?
- Did I place generated reports into Library?
- Did I preserve/report visual parity?
- Did I add or preserve tests?
- Did I keep the implementation modular and boring?

If any answer is no, stop and fix before moving on.

## Forbidden phrases as implementation excuses

The following are not valid reasons to write new code:

- "It will be cleaner to start fresh."
- "The new architecture wants a new approach."
- "This can be simplified later."
- "I stubbed it for now."
- "The old code is probably obsolete."
- "I implemented a minimal version."
- "We can restore parity after the architecture is in place."

The architecture is not in place until parity works.

## Desired Codex behavior

Codex should act like an archaeologist with power tools:

1. Locate v1 truth.
2. Extract only the valuable stone.
3. Cut away Supabase-era mortar.
4. Set it into the clean-start modular wall.
5. Test that the wall holds.

No marble shopping while the temple foundation waits.

## Success definition

This directive succeeds when Tony can run Astra Clean Start and complete this real flow:

```text
Create or open Self
  -> enter/confirm birth data
  -> generate chart
  -> generate LLM report
  -> view beautiful v1-quality report
  -> see report saved in Library
  -> repeat for Ally
  -> compare outputs against v1 expectations
```

At that point Astra is back online as a product, not merely an architecture.

## Final instruction to Codex

For the next implementation pass:

> Treat v1 as canon. Treat Supabase Auth as the contaminant. Quarry the canon, remove the contaminant, restore the product loop, and prove it with tests.

