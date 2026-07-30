---
title: "JourneyStep Product Model"
status: "accepted"
updated: "2026-07-20"
---

# JourneyStep Product Model

Journey is the private, ordered place where Astra gives a signed-in user the next meaningful thing to notice or do. It renders one current `JourneyStep`, a compact ordered queue, and a saved-for-later list. Signed-out `/` is a public product illustration; signed-out `/journey` redirects to login.

Journey continues to use Astra's current UI system and the shared `PublishedCard` surface. Astryx is not a Journey dependency or migration target. It may be evaluated later, in isolation, as a candidate for internal admin primitives only; that evaluation must not alter customer-facing Journey components or tokens.

## Contract and ordering

`UserFeedItem` is the durable user-owned projection. No schema change is required. Available items are ordered by `rankScore` descending and `availableAt` ascending; the first is current and the remainder are Up next. Saved items are separate from the active queue.

Actions map to existing persistent states and timestamps:

- Complete -> `seen` and `seenAt`.
- Save for later -> `saved` and `savedAt`.
- Dismiss -> `dismissed` and `dismissedAt`.
- Restore -> `available`, clearing prior action timestamps.

Every read and mutation is scoped by both `userId` and feed-item ID. Journey never exposes Composer decision traces, ranking scores, model details, or another user's projection.

## Producer integration

- Opening Journey for a profile whose onboarding status is still pending asks Composer to publish its deterministic private onboarding batch. Astra marks onboarding complete only after the full batch persists; a Composer outage leaves the profile pending so the next Journey visit retries without blocking auth, Self, Library, or report APIs.
- Successful report generation makes the report eligible for a curated, deterministic user-owned `report_signal` item; it does not guarantee a permanent Journey entry.
- A report signal qualifies only when the completed report is no more than 30 days old, has a matching private request, is not imported, legacy, preview/test data, or an unsupported report family, and is the newest report for its chart target and report type.
- Customer accounts may receive those curated report signals. Admin accounts receive no automatic report signals because their high-volume report runs are operational/test output; admin reports remain intact in Library.
- At most three report signals remain active. Opening Journey repairs existing available signals by marking ineligible, duplicate, excess, imported, test, orphaned, and stale signals seen. The repair is idempotent and never deletes or changes the report in Library.
- User-saved steps are not retired by automatic curation.
- Repeated producer writes may refresh authored card content but must preserve the user's durable state and original availability. A retry cannot resurrect a completed, saved, or dismissed step.
- Report-card continuity uses the private report request ID for `/library?reportId=...`; the public-signal ID is provenance, not an Astra route handle.
- Customer-facing report context is generated from the owning request in plain language. Engine, model, ranking, and debug provenance remain internal.
- The current step is primary. `Up next` discloses at most three titles while retaining an honest total count, so Journey never becomes a second Library.

## Product states and pattern acceptance

The rendered states are signed-out illustration, loading, private empty, one step, multiple ordered steps, saved steps, action failure, Composer delay with safe retry, and database failure. The implementation follows `01-time-to-value.md` (real onboarding value reaches Journey), `05-progressive-disclosure.md` (queue secondary to the current step), `20-fail-safe.md` (producer retries preserve user state), and `36-trust-building.md` (user-scoped projections and report provenance). No forbidden or adversarial pattern is used.

The analytics contract documents `journey_step_opened`, `journey_step_completed`, `journey_step_saved`, `journey_step_dismissed`, and `journey_step_restored`. Runtime emission remains N/A because Astra has no active client analytics transport. The durable database state remains the source of truth; no silent telemetry sink was invented.

## Surface ownership

Journey owns sequence and the next action. Library owns reports and durable artifacts. Self owns the user's chart and profile. Allies owns relationship records. Gifts owns granted value. Composer proposes private feed items across its existing contract; Astra alone renders and persists user actions.
