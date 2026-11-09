# UI production release — November 9, 2026

## Practical result

Promote the previously unshipped UI work from checkpoint `94eeeea` onto the current production application. Gold primary actions, dark gold-button text, explicit secondary/ghost/destructive roles, shorter “Welcome back.” heading, and the revised empty Journey guidance now accompany the newer production Self, Allies, report-entry, and writing flows.

This is a semantic integration of the pending UI changes, not a replacement with the older local branch. The older branch lacked later production report and onboarding work. Current labels such as “Create report”, report type selection, unknown-birth-time restrictions, Ally chart ownership, archive/restore, and the existing writing pipeline are preserved.

## Included work and provenance

- `app/globals.css`: shared `.button` role styling, `--gold-ink`, visible focus, disabled state, and role-consistent Self/Ally primary actions. Primary hover lightens the approved gold rather than darkening it below text contrast requirements. Existing native-button and segmented-control behavior is retained.
- Date/time, location, and birth-onboarding sheet styles: use the shared dark gold-button ink token.
- `JourneyStepReader.tsx` and `i18n.ts`: “Your Next Step Awaits.”, authored exploration guidance, and navigation instruction in place of the old redundant Self CTA. Undo, errors, notices, current/queued cards, and private archive behavior remain.
- `i18n.ts`: login heading becomes “Welcome back.”; all existing signup-cap and authentication messages remain.
- Restored the original `astra-auth-desktop.png` and `astra-auth-mobile.png` artwork from the older Astria project's public assets. This reuses artwork only, with no application/data/auth code carried over. Both production image URLs previously returned 404. The images are now bundled in Astra's own public directory and CSS uses relative URLs, so previews and production do not depend on missing remote assets.
- Existing current production tests were updated rather than replacing them with older snapshot tests. Added primary/secondary distinction, minimum 4.5:1 foreground contrast in both themes/hover, and keyboard-visible focus coverage. Route smoke failures now identify the missing resource URL.

## Product-pattern acceptance

Intended user outcome: the approved UI polish is consistently available in the actual live app while retaining the newest useful product flows.

Patterns: `source-library/patterns/07-empty-states.md` for useful next steps in an empty Journey; `06-setup-defaults.md` for predictable primary and subordinate action roles; `17-loading-feedback.md` for preserved loading/disabled behavior; `20-fail-safe.md` for private archive/undo and database preservation. The source-library README, guardrails, and event contract were consulted. No fake urgency, hidden collection, destructive shortcut, or new dependency was introduced.

Mobbin structural reference: Whereby profile, https://mobbin.com/screens/67862fed-13e3-4cb8-af0a-0f43f45eb37d, for keeping a prominent primary action distinct from secondary actions. It informed the role check only; Astra's approved palette, typography, content, and layout remain authoritative.

State coverage: logged-out route gates and login; empty Journey; populated current and queued steps; notices, failure/recovery and Undo; disabled report actions; Self/Ally success and missing-chart paths. No analytics behavior changes; existing Journey action/event contract remains intact. New analytics runtime emission is N/A for this styling/copy release.

File-to-acceptance mapping: shared CSS and sheet modules establish action-role distinction and contrast; Journey/i18n files deliver the authored empty state and welcome copy; public PNGs repair the missing visual assets; route/Journey/report-entry tests verify responsive rendering, private ownership and absence of accidental report charges.

## Validation

- Lint: no errors; one existing unrelated unused-variable warning in `repair-imported-ally-contexts.mts`.
- Typecheck, foundation check, i18n check, and production build passed.
- Production-mode Playwright run: 43 passed, two intentionally skipped duplicate lifecycle invocations. The desktop Journey lifecycle test performs its own desktop/tablet/phone sweep; it is not skipped coverage.
- Route smoke: `/`, `/journey`, `/allies`, `/self`, `/charts`, `/library`, `/gifts`, `/login` across desktop 1440×900, tablet 820×1180, and phone 390×844; console/page-error checks passed after repairing the background images.
- Authenticated Journey: privacy isolation, current/queue lifecycle, saved/archive restoration, recovery, notices and empty state.
- Report entry: Self same-chart entry, all labeled Ally entry paths, missing-chart Ally targeting, unknown-time Life Chapter restriction, and signed-out boundaries. Navigation does not generate a model request or debit Stars.
- Primary/secondary styles, hover text contrast and keyboard focus verified in light and dark themes at all three viewport sizes. WebKit tablet uses explicit focus plus a navigation key for its keyboard-modality check; its default Tab policy skips links and must not be mistaken for an app tabindex defect.
- Mechanical design check: only the pre-existing Inter font warning. The approved product font is preserved rather than changing the brand during release.

## Data and release boundaries

This is a code/artwork deployment. No schema change, live seed, reset, import, account creation, generated customer report, or credit adjustment is part of the release. The production database identity pin, five-account daily admission rule, owner notifications and privacy boundaries remain unchanged.

Before deployment, a fresh consistent archive and checksum/table-fingerprint manifest were saved privately at `.astra-exports/backups/pre-ui-release-2026-11-09.dump`. Baseline: 16 accounts/profiles, 17 Allies, 34 chart requests, 33 chart results, 72 report requests, 71 report results, 20 artifacts and 28 ledger entries. The UI test fixtures used a separate local `astra_ui_release_validation` database. Its admission limit was raised for synthetic test accounts only; production stays at five.

Promote the same tested source to both `main` and historical `alpha`, verify the Vercel deployment/source readback, check the bundled image URLs return 200, inspect the authenticated live Self/Journey/Allies path, and compare retained data fingerprints. Preserve older branches and the original UI history; do not restore the live database during a code rollback.
