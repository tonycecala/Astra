---
title: "Astra Birth Date and Time Entry UX"
type: "codex-inbox-directive"
project: "Astra Clean Start"
status: "completed"
completed: "2026-06-27"
archived: "2026-07-15"
completion_commit: "f996568"
---

# Codex Prompt: Astra Birth Date & Time Entry UX

## Mission

Implement Astra’s birth date, birth time, and birth timezone entry as a polished Apple-style adjustment sheet inspired by the provided Mobbin/iOS Photos “Adjust Date & Time” pattern.

This is not a generic form. This is the first sacred data-entry ritual in Astra. It must feel calm, precise, native, and trustworthy.

## Reference

Use the uploaded screenshot/reference image as the visual and interaction anchor:

- Large rounded modal/sheet surface
- Clear title centered at the top
- Close control on the left
- Primary action button on the right
- Summary card showing original/current value and adjusted/new value
- Calendar month grid
- Inline time control
- Time zone row
- Soft gray page background
- White cards with generous radius and breathing room
- Minimal chrome, high legibility, zero SaaS clutter

Do not copy Apple branding or proprietary assets. Recreate the UX pattern in Astra’s design language.

## Product Intent

Astra needs birth data entry to feel elegant because astrology depends on time, place, and context. The UI must teach the Explorer that precision matters without making the moment feel bureaucratic.

The Explorer should be able to enter or edit:

1. Birth date
2. Birth time
3. Birth timezone
4. Unknown or approximate birth time state

This component should support onboarding, chart creation, ally creation, and later chart editing.

## Required UX

Create a reusable birth date/time entry experience with this flow:

1. User opens “Birth Date & Time” editor.
2. A mobile-first modal/bottom-sheet appears.
3. Header contains:
   - Left: circular close button
   - Center: `Birth Date & Time`
   - Right: primary CTA button labeled `Save` or `Continue` depending on caller context
4. Top summary card shows:
   - `Current` value when editing an existing chart
   - `Selected` value for the new pending value
   - If creating a chart, use `Birth moment` and `Selected`
5. Calendar card shows:
   - Month/year heading
   - Previous/next month arrows
   - Day-of-week row
   - Month grid
   - Selected day highlighted with Astra accent styling
6. Below the calendar grid:
   - `Time` row with tappable time pill
   - `Time Zone` row with selected timezone and chevron
   - Optional `Birth time unknown` toggle or row
7. Footer helper text explains the consequence clearly:
   - Example: `Your chart will be calculated for May 16, 2023 at 9:00 AM, GMT+08:00.`
   - If birth time is unknown: `We’ll use a noon chart and mark time-sensitive placements as approximate.`

## Required Behavior

### Date selection

- Calendar must allow month navigation.
- Selected date must persist while moving between months.
- Today should not receive special visual dominance unless it is selected.
- Birth dates in the future must be disallowed.
- Reasonable historical dates must be supported.
- Validate impossible dates.

### Time selection

Use the best native-feeling control available in the current Astra stack.

Acceptable approaches, in order:

1. Native `<input type="time">` styled as a pill where browser support behaves well.
2. Custom lightweight hour/minute/AM-PM picker if native control is ugly or inconsistent.
3. Existing project date/time component only if it can be made to match this UX cleanly.

Must support:

- 12-hour display for US locale
- Internal 24-hour normalized storage
- Minute precision
- Keyboard accessibility

### Timezone selection

Timezone must be explicit. Do not silently infer and hide it.

Required:

- Show timezone in readable form, e.g. `America/Chicago`, `GMT-05:00`, or both if available.
- Default intelligently from browser/user locale when creating a new chart.
- Allow manual change.
- Store normalized IANA timezone where possible.
- If only offset is available, clearly preserve the offset and do not pretend it is an IANA zone.

### Unknown birth time

Astra must gracefully handle unknown birth time.

Required:

- Add a clear “Birth time unknown” option.
- When enabled:
  - Disable or de-emphasize exact time control.
  - Use noon locally for calculation fallback unless the existing chart engine already has a better convention.
  - Store a flag such as `birth_time_known: false` or equivalent existing schema field.
  - UI copy must explain that time-sensitive placements may be approximate.

Do not bury this behind an edge-case link. Many Explorers do not know their exact birth time.

## Data Contract

Before coding, inspect existing Astra chart/person/ally schema and use existing field names where they exist.

The component should produce a normalized value shaped approximately like:

```ts
type BirthDateTimeValue = {
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm, 24-hour local time, null when unknown
  timezone: string; // IANA zone preferred, offset fallback allowed
  birthTimeKnown: boolean;
};
```

Adapt naming to the actual repo conventions. Do not create duplicate parallel fields if schema already exists.

## Implementation Requirements

- Build this as a reusable component, not a one-off onboarding blob.
- Suggested component name: `BirthDateTimeSheet`, `BirthMomentSheet`, or match existing Astra naming conventions.
- Keep logic small, typed, and testable.
- Do not introduce a heavy date-picker library unless the repo already uses one and it is justified.
- Prefer native date utilities plus a small calendar grid helper.
- Keep dependencies boring.
- Preserve existing app routes and flows.
- Do not regress current chart creation.
- Do not overwrite newer flow work while touching older files.

## Visual Direction

Match the spirit of the reference:

- Mobile-first
- Rounded, spacious, quiet
- White cards on soft neutral background
- Clear black text for primary labels
- Muted gray for secondary values
- Single Astra accent for selected day, arrows, and CTA
- Large tap targets
- No dense form fields
- No dropdown soup
- No enterprise dashboard odor

This should feel more like setting a meaningful cosmic coordinate than filling out a tax form.

## Accessibility

Required:

- Keyboard navigable calendar
- Proper button semantics for day cells and month arrows
- ARIA labels for date buttons, selected date, previous/next month
- Focus states visible
- Escape closes sheet when safe
- Enter/Space selects focused date
- Screen reader copy for unknown time behavior

## Validation

Add validation that prevents save/continue when:

- No date selected
- Date is in the future
- Time is missing while `birthTimeKnown` is true
- Timezone is missing

Show calm inline errors. No shouty red-wall form failure.

## Tests

Add or update tests appropriate to the repo.

Minimum coverage:

1. Renders sheet with header, summary, calendar, time, timezone.
2. Selecting a date updates selected summary.
3. Month navigation works.
4. Future dates cannot be saved.
5. Unknown birth time disables exact time requirement.
6. Save returns normalized payload.
7. Timezone value is preserved.
8. Keyboard selection works for calendar day buttons where test tooling supports it.

Run the relevant unit/component tests and any existing targeted flow tests for chart creation/onboarding.

## Acceptance Criteria

The task is done only when:

- Astra has a reusable Apple-inspired birth date/time sheet.
- It works in chart creation and can be reused for ally/onboarding flows.
- Unknown birth time is supported cleanly.
- Timezone is explicit and stored safely.
- Mobile layout looks excellent.
- Desktop layout is not broken.
- Tests pass.
- No unrelated files are rewritten.
- No old chart/report/admin work is overwritten.
- The final Codex response includes changed files, tests run, and any schema decisions made.

## Forbidden

- Do not add a huge date picker package for one screen.
- Do not use a plain SaaS form with three fields and call it done.
- Do not hide timezone.
- Do not assume all Explorers know their exact birth time.
- Do not store display strings as canonical dates.
- Do not silently create future birth dates.
- Do not overwrite recent Astra flow improvements from other branches.
- Do not change astrology calculation semantics without documenting the decision.

## Final Deliverable

Ship the implementation, tests, and a concise closeout note.

Closeout note must include:

- What changed
- Where the reusable component lives
- How chart creation now calls it
- How unknown birth time is represented
- How timezone is stored
- Tests run and results
