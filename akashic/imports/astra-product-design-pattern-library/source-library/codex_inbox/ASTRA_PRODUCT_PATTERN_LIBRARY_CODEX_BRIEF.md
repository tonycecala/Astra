# Codex Brief: Astra Product Pattern Library

## Objective

Integrate the Astra Product Design Pattern Library into product planning, UI implementation, and QA.

## Source

This library was generated from the flattened text version of *The Product Design Playbook* and adapted specifically for Astra.

## Required Repo Placement

Place this folder under:

`docs/product-patterns/`

Recommended structure:

- `docs/product-patterns/README.md`
- `docs/product-patterns/patterns/*.md`
- `docs/product-patterns/audits/*.md`
- `docs/product-patterns/metrics/*.md`

## Implementation Rule

When changing any user-facing flow, Codex must identify the relevant pattern file(s) and update the PR notes with:

- pattern(s) used
- expected UX improvement
- analytics events added or reused
- empty/loading/error/success states covered
- dark-pattern guardrails checked

## Initial Implementation Targets

### 1. No-Auth Sandbox
Use:
- `01-time-to-value`
- `02-sandbox-experience`
- `06-setup-defaults`
- `07-empty-states`
- `30-the-paywall`

Build a public demo path that lets users experience Stream/Library/Report samples before creating an account.

### 2. Library Empty State Rewrite
Use:
- `07-empty-states`
- `10-effort-moat`
- `32-jtbd-copywriting`

Rewrite Library empty state so it teaches the concept of durable artifacts and prompts the first meaningful action.

### 3. Stream Discovery Pass
Use:
- `03-discovery`
- `04-personalisation`
- `13-intent-mirroring`
- `15-pattern-alignment`

Ensure Stream cards explain why they appear and provide a clear next action.

### 4. Success Moment System
Use:
- `08-success-moments`
- `16-micro-interactions`
- `27-gamified-progress`
- `33-small-quirk`

Create a reusable success moment component for first chart, report unlock, certificate, gift, and constellation.

### 5. Analytics Event Contract
Use:
- `metrics/ASTRA_PATTERN_ANALYTICS_EVENTS.md`

Add typed analytics helpers for listed events. Do not scatter string literals.

## Acceptance Criteria

- Documentation added under `docs/product-patterns`.
- No production behavior changes unless explicitly requested.
- Pattern docs linked from `docs/README.md`.
- Analytics event names standardized.
- No dark-pattern mechanics introduced.
