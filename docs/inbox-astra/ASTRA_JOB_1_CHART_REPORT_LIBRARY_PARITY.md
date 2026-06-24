---
title: "Astra Job 1: Chart → Report → Library Parity"
type: "codex-inbox"
project: "Astra Clean Start"
status: "ready-for-codex"
priority: "P0"
owner: "Codex"
created: "2026-06-22"
mission: "Restore the end-to-end astrology report loop in the clean modular Astra app."
tags:
  - astra
  - clean-start
  - reports
  - charts
  - library
  - self
  - allies
  - i18n
  - neon
  - better-auth
  - alpha-milestone
---

# Astra Job 1: Chart → Report → Library Parity

## Thread Mission

Make Astra useful again.

The clean-start architecture, i18n work, auth rework, and Supabase removal matter, but they are not the product loop. The product loop is:

1. A user creates a normalized chart for **Self**.
2. A user creates a normalized chart for an **Ally**.
3. Astra generates an LLM-backed report from that chart data.
4. The finished report appears in **Library**.
5. The report experience matches or exceeds Astra v1 visual quality.

This is now **Job 1**. All other architecture work serves this loop. Do not let refactoring become a velvet swamp.

## Product Goal

Restore the core Astra milestone:

> Generate charts for Self and Allies through a clean wizard UX, create reports using the modular LLM report system, and save those reports into Library with v1 visual/style parity.

This is the alpha gate before Star accounting.

## Non-Negotiables

- No Supabase dependency.
- No legacy migration work unless required to compare v1 output.
- Preserve the clean modular repo shape.
- Use normalized chart input and chart storage for both Self and Ally.
- Make the UX wizard-like, obvious, and recoverable.
- Reports must be persisted into Library, not merely shown once.
- Demo/static report content is no longer enough.
- LLM-backed report generation must be re-enabled and tested.
- Output must be comparable to v1 report quality and visual presentation.
- Do not break i18n routing or locale structure.
- Do not solve Star accounting in this pass. Prepare clean seams only.

## Architectural Boundary

Preserve the monorepo separation:

- `apps/astra-web`: public user app, auth, onboarding, chart creation, reports, Library, account.
- `apps/composer-web`: internal/operator stream machinery only.
- `packages/*`: shared contracts, domain primitives, UI atoms, schemas, tests.

Allowed dependency direction:

- `apps/astra-web -> packages/*`
- `apps/composer-web -> packages/*`
- `packages/* -> no app imports`

Forbidden:

- `apps/astra-web -> apps/composer-web`
- `apps/composer-web -> apps/astra-web`
- `packages/* -> apps/*`
- Composer internals leaking into user-facing Astra.

For this Job 1 mission, keep Composer out unless a shared package already owns a safe contract needed by reports.

## Desired User Journey

### A. Self Chart Wizard

Create or repair a wizard flow for the signed-in user:

1. Start from `/self`, `/library`, or a clear primary CTA.
2. Ask for birth data in a normalized sequence:
   - display name
   - birth date
   - birth time
   - birth location
   - time confidence, if supported
   - timezone/location resolution, if supported
3. Validate all fields before submission.
4. Generate chart data through the clean modular astrology engine.
5. Save the chart as the user's Self chart.
6. Generate the report.
7. Save the report to Library.
8. Navigate to the finished report view.

### B. Ally Chart Wizard

Create or repair the parallel Ally flow:

1. Start from `/allies` or Library CTA.
2. Create a new Ally with normalized identity fields:
   - name
   - relationship label/type, if supported
   - optional notes, if already in schema
3. Collect the Ally birth data using the same normalized chart wizard pattern as Self.
4. Generate the Ally chart.
5. Save it under the current user privately.
6. Generate the Ally report.
7. Save the report to Library.
8. Navigate to the finished report view.

### C. Library Result

Library must show reports created from real chart/report generation.

Each Library item should have, at minimum:

- title
- subject type: Self or Ally
- subject name
- report type
- created date
- status: generated, failed, draft, or pending if the system supports async states
- link to the report

## Normalization Requirements

Define or confirm one canonical internal shape for birth/chart input.

Recommended contract names are illustrative. Use repo conventions if different:

- `BirthDataInput`
- `NormalizedBirthData`
- `ChartSubject`
- `ChartRecord`
- `ReportRecord`
- `LibraryItem`

The same birth-data normalization path must serve Self and Ally. Do not build two nearly identical pipelines.

Birth data should normalize:

- date
- time
- location
- timezone
- latitude/longitude, if resolved
- uncertainty/unknown birth time, if supported
- locale-safe display strings

Chart generation should produce stable, testable chart data with no hidden UI-only transformations.

## LLM Report Generation Requirements

Re-enable real report generation, not demo prose.

The prior report engine pattern matters:

- Chart facts are generated by deterministic astrology/domain logic.
- The LLM does **not** invent chart facts.
- The LLM transforms bounded narrative/evidence plans into natural prose.
- The final prose must not expose internal signals, card keys, schemas, scoring, or metadata.
- Report generation must be repeatable enough for snapshot or fixture comparison.

Implement the clean-start version using the current modular architecture.

### Required Report Generation Pipeline

1. Accept a saved chart subject: Self or Ally.
2. Compute chart facts using the domain engine.
3. Build evidence/narrative plans from deterministic chart facts.
4. Render report sections with the configured LLM provider.
5. Persist:
   - raw chart data needed for audit/debug
   - report metadata
   - rendered report sections
   - generation provider/model/prompt version
   - errors, if any
6. Expose the finished report through Library.

## v1 Parity Target

The report visual style in Astra v1 was excellent. Restore that level.

Do not ship a plain developer page if v1 had a premium report surface.

Target qualities:

- elegant report header
- clear subject identity
- beautiful section rhythm
- readable long-form typography
- premium card/panel treatment
- mobile-first layout quality
- print/share-friendly structure if cheap to preserve
- graceful loading and failure states
- no raw JSON visible to normal users
- no internal signal names in rendered prose

Use existing v1 screenshots, components, styles, or design tokens if available in the repo. If v1 assets/components are not available, reconstruct the report UI with the same design intent rather than waiting.

## i18n Requirements

Do not bypass locale routing.

- Keep report routes locale-aware.
- Keep wizard labels translatable.
- Do not hard-code user-facing strings in deep domain packages.
- If full translation coverage is too broad, add structured keys and English defaults rather than scattering literals.

## Data Privacy Requirements

Charts and reports are private user data.

- Every Self chart belongs to exactly one authenticated user.
- Every Ally belongs to exactly one authenticated user.
- Every Ally chart belongs to the owner user through the Ally.
- Every report belongs to exactly one authenticated user.
- Library queries must only return the current user's reports.
- No public feed assumption.
- No Composer/public-stream leakage.

## Implementation Strategy

### Phase 1: Trace Existing Pieces

Find the current clean-start equivalents of:

- auth session/user id
- Self profile route/model
- Ally route/model
- chart calculation package/function
- report generation package/function
- demo report code
- Library model/route/view
- i18n route structure
- v1 report styling remnants or reusable design tokens

Document the actual files touched in the implementation summary.

### Phase 2: Canonical Contracts

Add or repair shared schemas/contracts for:

- birth data input
- normalized birth data
- chart subject
- chart calculation result
- report generation request
- report generation result
- Library item

Keep schemas boring, typed, tested, and app-safe.

### Phase 3: Self Wizard

Implement the Self chart wizard end-to-end.

Acceptance:

- signed-in user can enter valid data
- invalid data shows useful errors
- successful submit creates/updates Self chart
- user can generate report
- report appears in Library
- reload does not lose it

### Phase 4: Ally Wizard

Implement the Ally chart wizard end-to-end using the same normalized flow.

Acceptance:

- signed-in user can create Ally
- signed-in user can enter Ally birth data
- chart is generated and saved privately
- report is generated and saved privately
- report appears in Library with Ally identity
- Self and Ally reports do not overwrite each other

### Phase 5: LLM Reports

Replace demo-only report behavior with live LLM-backed generation.

Acceptance:

- local/dev env can generate a report through the configured model/provider
- missing API key fails gracefully with a clear dev-facing message
- generated content uses bounded chart evidence
- provider/model/prompt version are persisted
- no internal signals leak into user-facing prose

### Phase 6: v1 Visual Parity

Restore report view quality.

Acceptance:

- report page feels like a premium Astra artifact
- mobile and desktop both pass visual sanity checks
- Library card links to this premium report view
- loading, empty, error, and success states are intentional

### Phase 7: Tests and Validation

Do not ship this as vibes.

Add tests where the repo already supports them:

- unit tests for birth-data normalization
- unit tests for Self vs Ally subject ownership
- unit tests for report request generation
- integration tests for report persistence into Library
- E2E happy path for Self chart → report → Library
- E2E happy path for Ally chart → report → Library
- E2E failure path for invalid birth data
- E2E or integration check that another user's Library cannot see the report

Use existing test tooling and scripts. Do not introduce a new test framework unless the repo has none.

## Suggested Routes

Use actual app conventions if different, but the product shape should resolve to something like:

- `/:locale/self`
- `/:locale/self/chart/new` or embedded wizard
- `/:locale/allies`
- `/:locale/allies/new`
- `/:locale/allies/:allyId/chart/new`
- `/:locale/library`
- `/:locale/library/:reportId`

## Suggested Database Shape

Use current Neon/Drizzle conventions if already established. Do not invent table names if equivalents exist.

Minimum conceptual records:

### chart_subjects or equivalent

- id
- user_id
- subject_type: self | ally
- ally_id nullable
- display_name
- birth_data_normalized json/jsonb or typed columns
- chart_data json/jsonb
- created_at
- updated_at

### allies or equivalent

- id
- user_id
- name
- relationship_label nullable
- notes nullable
- created_at
- updated_at

### reports or library_reports equivalent

- id
- user_id
- subject_type
- subject_id
- ally_id nullable
- report_type
- title
- status
- provider nullable
- model nullable
- prompt_version nullable
- chart_snapshot json/jsonb
- sections json/jsonb
- error nullable
- created_at
- updated_at

The critical rule: Library should query report records, not a mock/demo list.

## Completion Definition

This job is done only when:

- A signed-in user can generate a Self chart.
- A signed-in user can generate an Ally chart.
- Both can produce LLM-backed reports.
- Both reports persist into Library.
- Both reports can be reopened from Library after refresh.
- Report UI has v1-level polish or a clear restored equivalent.
- i18n routing still works.
- Privacy boundaries hold.
- Tests pass.
- Production/preview deploy does not require Supabase.
- Implementation summary lists files changed, tests run, and any remaining explicit gaps.

## What Not To Do

- Do not continue re-architecting without restoring the product loop.
- Do not make a second demo report system.
- Do not hard-code a fake Library item.
- Do not generate a report that cannot be reopened.
- Do not create separate Self and Ally chart engines.
- Do not let the LLM infer chart facts.
- Do not expose card keys, signals, prompt metadata, or scoring in user prose.
- Do not solve Star accounting yet.
- Do not add public feed assumptions.
- Do not entangle Composer with Astra user report generation.

## Next Milestone After This

After this lands, the next product milestone is:

> Star accounting and alpha readiness.

That means Star purchases/credits/spending should attach cleanly to report generation, Ally features, Gifts, or premium actions. But this should come **after** chart/report/library parity works.

## Codex Closeout Required

When finished, report back with:

1. Exact routes implemented or repaired.
2. Exact models/tables touched.
3. Exact report generation provider/model behavior.
4. Screenshots or notes comparing report UI to v1 style.
5. Tests added.
6. Commands run.
7. Known gaps, if any.
8. Confirmation that Supabase is not required.
9. Confirmation that Self and Ally reports persist into Library separately.

Ship the loop. Then we can hang stars on the machine. ✨
