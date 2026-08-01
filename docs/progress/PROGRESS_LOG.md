---
title: "Astra Progress Log"
type: "repo-progress-log"
status: "active"
scope: "Astra"
created: "2026-06-16"
owner: "Tony"
repo: "Astra"
summary: "Durable session-by-session memory for Astra repo work."
---

# Astra Progress Log

## Entries

### 2026-08-01 - Explicit Synastry Production Writer Policy

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** production writer-policy alignment
**Status:** complete

#### What Changed

- Made `anthropic/claude-sonnet-4.6` the named production default for new Synastry reports and retained `anthropic/claude-sonnet-5` as the named default for all non-Synastry reports.
- Aligned the strategy decision, runtime resolver, hosted deployment guard, and regression smoke; no saved report record or content was changed.
- Recorded the TC + CA V3.1.1 controlled comparison and owner-reviewed result: Sonnet 4.6 completed in one pass at 1,441 words, while Sonnet 5 required a corrective retry and finished below the target word range.

#### Validation And Steward Review

- Passed model-strategy, Synastry engine, Synastry validation, TypeScript, lint, and production build checks. Lint retains one unrelated pre-existing warning in `scripts/repair-imported-ally-contexts.mts`.
- Browser QA on the existing private Synastry report confirmed rendered report integrity, no console errors, and no horizontal overflow at phone and tablet widths without triggering a regeneration or write.
- Steward judgment: **accept**. Policy, code, test, deployment boundary, and durable decision record agree; saved-report immutability and the non-Synastry Sonnet 5 default remain preserved.

#### Next Copy/Paste Goal

Generate one new private Synastry report from the normal flow, confirm its debug details show `anthropic/claude-sonnet-4.6`, then compare it with one new non-Synastry report confirming `anthropic/claude-sonnet-5`; do not modify or regenerate any saved report.

### 2026-07-31 - Synastry V3.1 Production Reliability

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** report-generation production implementation and live diagnosis
**Status:** complete with editorial notes

#### What Changed

- Promoted the approved psychology-first V3.1 contract for new Synastry reports while preserving strongest-15 direct chart signals, stable private Evidence IDs, immutable saved reports, server-derived Ally tone, and public-share suppression.
- Added one private mechanism, conditional lived expression, and relational consequence trace for every rendered paragraph.
- Separated semantic-review formatting failure from writer acceptance, raised the reviewer JSON allowance, and preserved valid portraits with a private reviewer-unavailable note after one reviewer-only retry.
- Moved Synastry to the existing Deep report bounds of 240 seconds and 8,000 output tokens so the 1,500-word portrait and private trace can complete together; corrective prompts prohibit analysis or thinking blocks.

#### Live Failure Evidence

- Request `8bf2116b-8730-4214-b13c-84018810dd74` contained complete writer prose but failed because both 700-token semantic reviews ended at the output limit without parseable JSON.
- Request `7c2363f2-080d-4238-b54b-a981bd55e05c` failed at 90.7 seconds before a writer draft returned, proving the standard timeout was too short.
- Requests `a7f37138-9e28-441a-9787-01221597fa8d` and `dcc3edeb-3658-44b9-8c10-7bcd9008ee6f` proved that 4,200 and 6,500 tokens could truncate the required private trace or a corrective response.
- Request `48db9887-11df-4f5c-9d7b-0bc90348e3c4` completed with prompt `astra-synastry-v3.1-psychology-first-2026-08`, schema 2, 1,428 words, 14 paragraph traces, completed semantic review, and six owner Evidence drawers.

#### Validation And Steward Review

- Synastry packet, engine, and validation smokes passed; targeted ESLint, TypeScript, and the Astra production build passed.
- Focused Playwright desktop and mobile journeys passed for Ally edit/tone routing, responsive report ordering, owner-only Evidence, public-share suppression, and console/page errors.
- Steward judgment: **accept-with-notes**. Reliability and privacy boundaries are accepted. Editorial cleanliness remains a monitored risk because the live report green-lit under the approved `more than two fatal categories` rule while retaining exactly `technical_surface` and `perspective_erasure`.

#### Next Copy/Paste Goal

Review Michelle report `48db9887-11df-4f5c-9d7b-0bc90348e3c4` as the first live Synastry V3.1 portrait, then decide whether V3.1.1 should reduce technical astrology density and strengthen second-person perspective while preserving strongest-15 evidence, paragraph traces, and the current acceptance arithmetic.

### 2026-07-30 - TypeScript 7 Throughput Trial

**Report Level:** 4 - Implementation / Debug Handoff
**Actor:** Codex
**Session Type:** compiler migration benchmark
**Status:** complete

#### What Changed

- Added TypeScript 7.0.2 as Astra's CLI compiler while retaining the TypeScript
  6 API for Next.js and `typescript-eslint`.
- Removed the TypeScript 7-incompatible `baseUrl` option and made workspace
  alias targets explicitly relative.
- Recorded the reproducible benchmark, compatibility findings, rollback, and
  validation playbook.

#### Validation

- Five-run no-cache typecheck mean: 5.600s to 0.688s (8.14x faster).
- Cold `npm run check`: 22.05s to 17.77s (19.4% faster).
- TypeScript 6 and 7 typechecks passed with identical Astra-owned file
  coverage.
- Fresh `npm ci` and full `npm run check` passed on the trial branch.
- Steward judgment: accept-with-notes; retain TS6 until TS7 exposes a supported
  programmatic API and the dependent tools adopt it.

#### Next Copy/Paste Goal

Review and merge the isolated TypeScript 7 throughput branch, then use normal
Astra development for one session and compare observed verification latency
before standardizing the same side-by-side layout in Composer or other repos.

### 2026-06-19 - Shared Card Face And Mobile Chrome Stabilization

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** Astra/Composer card and shell polish
**Status:** complete

#### What Changed

- Added Composer availability selection into Astra Journey so `/journey?composerSelected=1&course=astrology_101&count=5` can render deterministic Composer-selected Astrology 101 cards without writing private feed rows.
- Fixed Composer selection default dates to use local calendar time instead of UTC day slicing.
- Removed visible debug metadata pills from selected Journey cards while preserving hover/debug titles and the social action bar.
- Moved Astra account/avatar controls into the lower-left sidebar whenever the sidebar is visible; mobile keeps a compact top account strip.
- Replaced the Astra sidebar home icon with the Stars mark plus Astra wordmark, and documented the product rule that there is no Home in this UI: Self is closest to home, and Journey is the metaphor for going home with Allies, Resources, and Gifts.
- Added shared `@astra/ui` `PublishedCard` structure so Astra Journey and Composer Course render the same card face: copy first, image second, shared media/body/read-more styling, no Workbench/Explorer drift.
- Fixed Composer dark-theme refresh flash by applying `data-composer-theme` before paint and moving the toggle to the same stable external-store pattern used by Astra.
- Updated Astra mobile chrome so the active route title is the leftmost top-bar item, the duplicate page header is hidden on mobile, and the topbar is fixed instead of sticky to remove scroll jitter.
- Added a future evaluation note: mobile chrome may eventually appear/disappear based on scroll direction, but only after testing card-reading calm, orientation, and accidental navigation risk.
- Fixed an auth-panel hydration mismatch discovered by route e2e using a deterministic client-ready snapshot.

#### Lessons And Notes

- Browser-visible truth won this session: several shell and card decisions looked plausible from CSS but needed mobile/desktop measurement to catch duplicate controls, breakpoint mismatches, hidden mobile headings, and sticky topbar jitter.
- Shared card structure belongs in `@astra/ui`; Composer may wrap it with quiz/workbench controls, but the published card face should stay one renderer and one class contract.
- Mobile route chrome is now the page title surface. Tests should assert `.topbar-route-title` on mobile and body headings on desktop/tablet.
- Fixed top/bottom mobile chrome should be stable before experimenting with scroll-direction hiding. Scroll-responsive chrome is a future UX evaluation, not a default.
- Composer theme must be seeded before paint. Client-only theme correction causes visible white flash in dark mode, especially in Arc.

#### Validation

- Browser QA verified Astra `/journey`, `/self`, and Composer `/course` across mobile/desktop as relevant: no console errors, no horizontal overflow, copy-before-image card order, fixed mobile topbar position, and stable dark Composer refresh.
- `npm run typecheck` passed.
- `npm run lint` passed with the two known/shared `<img>` warnings only.
- `npm run check:no-supabase` passed.
- `npm run check:boundaries` passed.
- `npm run test:composer-selection-api` passed.
- `npm run test:e2e` passed: 45 passed, 3 skipped.
- `npm run build` passed for Astra.
- `npm --workspace apps/composer-web run build` passed for Composer.

#### Next Copy/Paste Goal

Review the polished mobile shell and shared card face in Astra Journey and Composer Course, then decide whether the next pass should tune mobile chrome density, author/avatar card rows, or scroll-direction chrome behavior.

### 2026-06-18 - Composer Course Assessment UX Matches V1

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** Composer Course UX stabilization
**Status:** complete

#### What Changed

- Replaced the Course page's placeholder assessment disclosure widgets with a Composer-local client component that follows the v1 quiz UX: one expandable question row, chevron affordance, and explicit Show answer / Hide answer reveal.
- Rendered all Course quiz/test/certification assessment cards with their existing remote `media.astraportrait.com` image metadata in 1:1 non-cropping frames.
- Changed the assessment type pill from a clickable route link into an inert status badge so clicking "Multiple choice" no longer navigates to an unexpected card URL.
- Kept new Course assessment UI chrome wired through Composer i18n labels and neutral light/dark CSS tokens.
- Fixed the card-detail workbench control's initial draft load so repo lint passes under the React hooks rules.
- Added `npm run test:composer-course-ux` to pin assessment image rendering, inert badges, accordion toggle behavior, answer reveal, console/page-error health, and desktop/tablet/phone overflow.

#### Validation

- `npm run lint` passed with existing `<img>` warnings only.
- `npm run typecheck` passed.
- `npm run test:composer-quarry` passed.
- `npm run test:composer-course-ux` passed.
- `npm run test:composer-card-detail` passed.
- `npm run composer:status` confirmed durable Composer server on port `3012` with `/ 200 OK`.
- Tracked image/media binary scan returned no tracked binaries.
- Browser QA via Playwright verified `/course` at 1440x900, 820x1180, and 390x844: 12 assessment cards, 12 assessment images, zero clickable assessment pills, 12 inert badges, quiz collapse/reopen works, Show answer marks exactly one correct choice, no horizontal overflow, and no console/page errors.

#### Next Copy/Paste Goal

Continue Composer Course builder stabilization from the v1-style assessment UX now restored on `/course`. Next, review the remaining Course page against v1 for lesson sequencing, card detail handoff, quiz/test/certification preview depth, and shared Astra published-card parity; keep assessment pills inert, Course images remote-only and 1:1 non-cropping, UI chrome i18n-backed, neutral light/dark theming, no Supabase, no runtime DDL, and no image/media binaries in git. Verify `/course`, `/cards`, `/library`, `/cards/[cardId]`, and Astra Journey selected-card mode in browser QA.

### 2026-06-17 - Composer Durable Server And Card Detail Control Point

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** Composer workbench continuity
**Status:** complete

#### What Changed

- Added a repo-owned durable Composer dev-server helper for port `3012`, exposed as `npm run composer:up`, `composer:status`, `composer:restart`, `composer:stop`, and `composer:logs`.
- Captured the persistent-server rule in `AGENTS.md`: existing repo launchers first, then `pm2`/`screen`/`tmux`, avoid LaunchAgents by default on this machine, never call `nohup` or a stale tab sufficient, and require listener plus real route health.
- Documented the durable Composer local loop in the root README and Composer README while keeping `npm run composer:dev` for foreground iteration only.
- Expanded `/cards/[cardId]` from read-only inspection into a workbench control point with collection/course membership, scoped server queue-draft state controls, and an explicit future clean-start edit/version API posture panel.
- Added card membership derivation for course, series, lane collection, ontology, onboarding, and feed/pool links without reviving v1 seed mutation, image generation runtime, Supabase, or runtime DDL.
- Added card-detail handoff from the Cards workbench and kept Course assessment badges inert after UX review, so "Multiple choice" and similar status pills do not navigate unexpectedly.

#### Validation

- `npm run composer:restart` starts Composer in `screen` session `astra-composer-web-3012`; `npm run composer:status` reports port `3012` listening and `/ 200 OK`.
- `npm run typecheck` passed.
- `npm run test:composer-card-detail` passed.
- Direct route check confirmed `/cards/astro101_067_quiz_signs_are_styles_not_sentences` renders Collection membership, Queue draft state, Edit and version APIs, quiz content, and remote image metadata.

#### Next Copy/Paste Goal

Superseded by the current Course assessment UX goal above.

### 2026-06-17 - Composer V1 Quarry Tabs And Starter Library

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** Composer v1 quarry expansion
**Status:** in progress

#### What Changed

- Expanded the clean-start Composer app beyond dashboard/review/onboarding/settings with v1 quarry tabs: Drafts, Cards, Course, Library, Voices, and Offers.
- Imported the v1 Composer starter library into clean-start fixtures: 205 stream cards, 200 cards with image metadata, and 12 sign reference cards. Generated image binaries are intentionally excluded from git.
- Added a clean local card-library reader and filterable card workspace without bringing over old Neon runtime DDL, Supabase assumptions, or v1 stream-store behavior.
- Updated onboarding publish fixtures to read the imported v1 first-run cards while preserving Astra's existing internal-token publish contract.
- Kept the new tabs, filters, headings, nav, empty states, and theme text wired through Composer-local i18n.
- Fixed a light/dark theme state mismatch found during browser QA when stored theme state differed from the document theme.
- Added `npm run test:composer-quarry` to pin the starter-library counts and asset-copy boundary.
- Fixed Composer card previews after excluding local image binaries from git: card rendering now prefers remote `media.astraportrait.com` URLs over old local `/stream-art/...` paths.
- Replaced the clean-start approximate card preview styling with v1 quarry card classes/rules for `composerCardGrid`, `composerCardPreview`, `composerPublishedCard`, `composerPublishedCardMedia`, and `composerTagRow`.
- Added a paged `/api/cards/query` boundary for Composer Cards/Drafts/Course so the 205-card fixture is no longer rendered as one in-memory client surface.
- Promoted the published-card body and CSS into shared `@astra/ui` so Composer previews and Astra Journey cards use the same 1:1 media, text clamp, and Show more / Show less behavior.
- Added the first session-local operator queue controls to the paged card workspace: select visible, clear selection, mark reviewing, approve selected, hold selected, and per-card queue state pills.
- Trimmed Composer card preview chrome so the published-card face stays calmer: no visible tag-pill row, and lower metadata is limited to type plus feed while detailed status/tags remain available through filters.
- Added the first operator detail panel for the queue: active card review, publish-readiness cue, target user input, and session-local decision notes.
- Rechecked the v1 Composer card breakpoints and adjusted clean-start Composer previews for the narrower operator shell: 3 columns on default desktop, 4 only on very wide screens, 2 on tablet, 1 on phone, with Composer preview media using `contain` to avoid image cropping.
- Added `POST /api/cards/publish` for the card queue so an approved imported card can be translated into a clean-start `ComposerPrivateFeedWrite` and posted to Astra through the existing internal-token private-feed endpoint.
- Added `npm run test:composer-card-queue-api` to prove queue publish guard states, deterministic/idempotent feed item ids, user-owned private feed visibility, and User A/User B isolation.
- Added `POST /api/cards/publish-batch` for selected Composer cards, preserving deterministic private-feed ids per target user/card and returning partial-success results when voice validation rejects individual cards.
- Replaced the remaining visible Composer "SaaS green" approval/success treatment with neutral gray/ink tokens in light and dark mode; retained semantic error/warning colors only where they carry operator meaning.
- Tightened batch-publish i18n copy from "ready" to "approved" so the queue summary does not overclaim final voice-validation readiness.
- Added deterministic page-state metadata to `/api/cards/query`: cache key, filter fingerprint, result window, previous/next flags, and selection limit for the current page.
- Added `POST /api/cards/prepare-batch` as a no-write operator preflight that returns a stable queue plan id, publishable count, needs-review count, duplicate count, and validation issues before any Astra private-feed write.
- Added a Composer `/cards` "Check selected" action so operators can preflight approved selected cards before clicking the explicit publish action.
- Replaced page-local selected-card state with a scope-local queue draft in browser storage so selected cards, queue states, target user, and decision notes survive pagination and refresh without adding runtime DDL.
- Updated Composer `/cards` queue summaries to distinguish visible selected cards from total selected cards, supporting cross-page batches while keeping the write batch limit explicit.
- Added the first Drizzle-owned Composer queue/cache persistence slice through migration `0004_cuddly_smasher`: `composer_card_query_caches` for deterministic `composer_cards:*` query windows and `composer_queue_drafts` for operator queue drafts.
- Added Composer server APIs for durable queue state: `/api/cards/query` now opportunistically persists query cache rows, and `/api/cards/queue-draft` can save/load/delete a scoped operator draft without changing Astra private-feed publish contracts.
- Added explicit `/cards` controls to save and load the server queue draft, keeping browser-local draft state as a fast preview layer while introducing a migration-owned persistence boundary.
- Added the next Drizzle-owned Composer lifecycle slice through migration `0005_bent_rawhide_kid`: `composer_queue_publish_plans` stores prepared `composer_queue_plan:*` summaries, selected card ids, query cache keys, validation issues, and item-level feed/write ids.
- Added `/api/cards/publish-plan` so Composer can load/delete a persisted queue plan by id, and updated `/api/cards/prepare-batch` to persist the plan and connect it to the scoped operator draft.
- Stabilized Composer `/cards` resume behavior so loading a server draft with `lastPlanId` reloads the persisted plan, restores the preflight summary, and surfaces the first validation issues through i18n-backed UI chrome.
- Reframed the visible Composer model around Cards as the workbench, Library as read-only inventory, and Course as a specialized Astrology 101 builder instead of expanding primary tabs for every content type.
- Added a small Composer card ontology in code: lesson, reflection, quiz, test, certification, art, onboarding, and series.
- Replaced the placeholder Astrology 101 assessment slice with the real authored v1 course: 78 course cards across foundations, zodiac, planets, houses, aspects/timing, reflection/quiz, completion, quiz packs, and final test.
- Imported the v1 Astrology 101 module fixtures as text data only: first 12, zodiac 13-24, planets 25-34, houses 35-46, aspects 47-54, timing 55-60, reflection 61-66, quiz module 67-71, certification 72, and quiz/final-test pack 73-78.
- Added remote generated-image metadata for all 78 Astrology 101 cards from v1 Composer's R2 URL map, without copying generated image binaries into git.
- Added structured quiz/test support to clean-start Composer cards and availability cards so multiple-choice questions, choices, correct answers, and explanations survive Course, availability, selection, and Journey retrieval.
- Added a reusable Course UX pattern on `/course`: ordered sections, assessment inventory, compact quiz/test cards, and accordion-style answer/explanation widgets.
- Restored the v1 Composer direct-card workflow as a clean-start read-only detail route at `/cards/[cardId]`, with full published-card preview, card metadata, quiz accordions, and availability/debug JSON without old seed mutation or image-generation runtime code.
- Added compact card-detail links to every visible Cards workbench tile while keeping the existing eye action for the queue review side panel.
- Removed Voices and Offers from the primary Composer nav while leaving the routes in place as non-primary posture pages.
- Added the first clean-start Composer availability contract in `@astra/contracts` for course, series, pool, ordered-list, and onboarding retrieval.
- Added Composer `/api/library/availability` so Composer can serve Astrology 101, ordered card lists, series/pools, and onboarding sets from the workbench/library model.
- Added Astra `/api/composer/availability` as the validating retrieval edge that proxies Composer availability for Astra-side consumers.
- Added migration `0006_closed_lizard` with Drizzle-owned Composer library availability tables: `composer_library_collections` and `composer_library_collection_cards`, including collection/status/source indexes, collection/order uniqueness, ontology, section, and status indexes for larger-card retrieval.
- Added repository helpers to upsert, load, and delete Composer library availability through the shared availability contract, and wired local reset to clear the new collection tables.
- Updated Composer `/api/library/availability` to persist the served availability collection and return `cache.persisted: true`, while keeping fixture fallback if local DB persistence is unavailable.
- Added the first Astra selection contract and service over Composer availability: deterministic user/date selection from a course, ordered list, series, pool, or onboarding request without creating user-owned private feed rows.
- Added Astra `/api/composer/selection` so Astra can request daily Composer-selected cards from Astrology 101 or other availability sets without operator-to-user sending.
- Added eligibility context to the Composer selection request shape so Astra can pass beginner/topic/tag/JSON policy hints now, with room for future script or LLM selection without changing the availability spine.
- Exposed a safe Journey selected-card mode at `/journey?composerSelected=1&course=astrology_101&selectionDate=2026-06-17&count=5`, mapping Composer-selected cards into the Journey stream as `composer_selection` / `composer_selected` items rather than private-feed writes.
- Added i18n-backed Journey labels and empty-state copy for Composer-selected course cards, keeping the UI explicit that these are selected from Composer availability and are not user-owned private feed rows.

#### Tests Run

- `ak governance check`
- `npm run test`
- `npm run typecheck`
- `npm --workspace apps/composer-web run typecheck`
- `npm run lint`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run check`
- `npm --workspace apps/astra-web run build`
- `npm --workspace apps/composer-web run build`
- `npm run test:composer-quarry`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-card-queue-api`
- `npm run test:composer-stream`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-private-feed-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-onboarding-cards`
- Browser QA swept Composer `/`, `/drafts`, `/cards`, `/course`, `/library`, `/review`, `/onboarding`, `/voices`, `/offers`, and `/settings` at desktop/tablet/phone with no console errors and no horizontal overflow; verified `/cards` search for Cleopatra and light/dark theme toggle.
- Browser QA rechecked `/cards` after the no-image-binaries guard: first visible cards use remote image URLs, no local generated images are tracked, and no horizontal overflow was observed.
- Browser QA confirmed `/cards` uses the quarry card CSS with clean-start breakpoints: 3-column default desktop, 4-column wide desktop, 2-column tablet, 1-column phone, 1:1 media frames, 6px image radius, remote image URLs, and no horizontal overflow.
- Browser QA confirmed Composer `/cards` renders 48 cards per page, uses remote 1:1 media, has no horizontal overflow on desktop/tablet/phone, and toggles Show more -> Show less -> Show more from i18n labels.
- Fresh-browser Astra `/journey` QA confirmed signed-out public fallback cards use the same shared published-card classes, 1:1 media, Show more / Show less behavior, and no horizontal overflow; the current in-app session remains correctly private-empty.
- Browser QA confirmed Composer `/cards` queue controls: 48 visible cards, Select visible updates 48 selected cards, Hold selected updates visible queue-state pills, card tag pills stay hidden, metadata pills are reduced, and desktop/tablet/phone have no horizontal overflow.
- Browser QA confirmed the Composer `/cards` review control is a compact 30x30 icon action, the detail panel updates one active card, decision notes and target-user readiness work in a fresh Playwright browser, and Composer media previews use `background-size: contain`.
- Browser QA confirmed Composer `/cards` can publish an approved queue card through the visible panel, display the deterministic private feed item id, and preserve the 3/2/1 responsive card breakpoints with contained 1:1 media and no horizontal overflow.
- Browser QA confirmed Composer `/cards` batch publish from the rendered UI: 48 selected cards -> 46 private feed writes and 2 validation items needing review, no console/page errors, no horizontal overflow, and deterministic ids displayed in the result.
- Browser QA confirmed neutral Composer theme colors after the green removal: light approval pill `rgb(23, 23, 23)` on neutral gray, dark page background `rgb(19, 19, 19)`, dark approval text `rgb(243, 243, 240)`, and neutral primary buttons in both themes.
- Browser QA rechecked card image geometry after the breakpoint changes: first card media rendered 349x349, aspect ratio `1`, `background-size: contain`, `background-repeat: no-repeat`, centered remote image, and no horizontal overflow.
- Browser QA confirmed Composer `/cards` now displays deterministic page-state context (`Window: 1-48`, `composer_cards:*` cache key) and the no-write preflight result (`46 publishable`, `2 need review`, `composer_queue_plan:*`) before publish.
- Browser QA rechecked `/cards` after the preflight UI: desktop 3 columns, tablet 2, phone 1, wide desktop 4, query cache visible at each viewport, no horizontal overflow, and no console/page errors.
- Browser QA confirmed Composer `/cards` cross-page local queue drafts: selected 48 cards on page 1, paged to page 2, selected 48 more, approved all 96, refreshed, and verified 96 selected cards, 96 queue states, and target user persisted locally with no console/page errors.
- Browser QA confirmed cross-page preflight remains bounded and explicit: 96 selected cards produced a no-write plan showing `46/96 publishable`, `2 need review`, `limit 48`, and a deterministic `composer_queue_plan:*`.
- `npm run db:migrate`
- `npm run typecheck`
- `npm run lint`
- `npm --workspace apps/composer-web run build`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run test:composer-quarry`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-card-queue-api`
- Tracked image binary check: `git ls-files | rg -i '\.(png|jpe?g|gif|webp|avif|heic|tiff?|bmp|ico)$' || true` returned no tracked image binaries.
- Browser QA confirmed the Drizzle-backed server draft path: selected/approved 48 cards, checked selected, saved server draft, cleared local state, loaded server draft, and verified `composer_queue_draft:local-operator:all`, 48 persisted selected cards, one query cache key, no horizontal overflow, and no console/page errors.
- Browser QA rechecked the new Save/Load server draft controls at desktop/tablet/phone/wide: 3/2/1/4 card columns respectively, controls visible, no horizontal overflow, and no console/page errors.
- Browser QA rechecked Composer `/cards` after publish-plan stabilization at desktop/tablet/phone: route 200, 48 cards rendered, Check selected/Save server draft/Load server draft controls visible, no page-level horizontal overflow, and no console/page errors.
- `npm run typecheck`
- `npm run lint`
- `npm --workspace apps/composer-web run build`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run test:composer-quarry`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-card-queue-api`
- Browser QA rechecked `/cards`, `/library`, and `/course` at desktop/tablet/phone after the workbench pivot: Cards shows 210 total cards, Library shows read-only ontology with 8 ontology types and 7 library groups, Course shows Astrology 101 with 5 sections and certification content, no console/page errors, and no horizontal overflow.
- `npm run typecheck`
- `npm run lint`
- `npm --workspace apps/composer-web run build`
- `npm --workspace apps/astra-web run build`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run test:composer-quarry`
- `npm run test:composer-availability-api`
- Browser QA rechecked `/cards`, `/library`, `/course`, Composer `/api/library/availability?requestType=course&id=astrology_101&limit=100`, and Astra `/api/composer/availability?requestType=course&id=astrology_101&limit=100` at desktop/tablet/phone where relevant: both APIs return 65 Astrology 101 cards, and visible routes had no console/page errors or horizontal overflow.
- `npm run db:generate`
- `npm run db:migrate`
- `npm run typecheck`
- `npm run lint`
- `npm --workspace apps/composer-web run build`
- `npm --workspace apps/astra-web run build`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run test:composer-quarry`
- `npm run test:composer-availability-api`
- Browser QA rechecked `/cards`, `/library`, `/course`, Composer `/api/library/availability?requestType=course&id=astrology_101&limit=100`, and Astra `/api/composer/availability?requestType=course&id=astrology_101&limit=100`: Composer API returns `cache.persisted: true`, both APIs return 65 Astrology 101 cards, and visible routes had no console/page errors or horizontal overflow.
- `npm run typecheck`
- `npm run lint`
- `npm --workspace apps/astra-web run build`
- `npm --workspace apps/composer-web run build`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run test:composer-availability-api`
- `npm run test:composer-selection-api`
- Browser QA rechecked `/cards`, `/library`, `/course`, and Astra `/api/composer/selection?userKey=browser_selection_user&requestType=course&id=astrology_101&selectionDate=2026-06-17&count=5&limit=100`: selection returns 5 cards from 65, is deterministic for the same user/date, rotates for the next date, and visible routes had no console/page errors or horizontal overflow.
- `npm run typecheck`
- `npm run test:composer-selection-api`
- `npm run lint`
- `npm run test:composer-availability-api`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm --workspace apps/astra-web run build`
- `npm --workspace apps/composer-web run build`
- Tracked image/media binary check: `git ls-files | rg -i '\.(png|jpe?g|gif|webp|avif|heic|tiff?|bmp|ico|mov|mp4|mp3|wav|pdf|zip)$' || true` returned no tracked binaries.
- Browser QA rechecked Composer `/cards`, `/library`, `/course`, and Astra `/journey?composerSelected=1&course=astrology_101&selectionDate=2026-06-17&count=5` at desktop/tablet/phone: Journey rendered 5 Composer-selected Astrology 101 cards, showed selected-mode labels, did not show the private Journey label, and had no console/page errors or horizontal overflow.
- Astra selection API QA confirmed `/api/composer/selection?requestType=course&id=astrology_101&selectionDate=2026-06-17&count=5&topic=beginner&eligibility={"pace":"daily"}` returns 5 cards with deterministic selection mode and merged eligibility hints.
- `npm run typecheck`
- `npm run test:composer-quarry`
- `npm run test:composer-availability-api`
- `npm run test:composer-selection-api`
- `npm run lint`
- `npm --workspace apps/composer-web run build`
- Tracked image/media binary check returned no tracked binaries after importing Astrology 101 image URL metadata.
- Browser QA rechecked Composer `/course`: 78 course cards, 7 sections, 10 quizzes, 40 structured multiple-choice questions, 2 test/certification cards, 12 visible sampled course images from `media.astraportrait.com`, old placeholder quiz copy absent, quiz accordion opens to choices plus correct answer/explanation, no console errors, and no horizontal overflow at desktop/tablet/phone.
- `npm run test:composer-card-detail`
- Browser QA verified `/cards/astro101_067_quiz_signs_are_styles_not_sentences`: direct route renders, remote square media appears, availability preview is visible, quiz accordion opens with correct answer/explanation, and desktop/tablet/phone have no horizontal overflow.
- Browser QA verified `/cards` exposes one detail link per visible card on the first page, alongside the existing queue-review eye action, with no console warnings/errors.

#### Risks / Follow-ups

- The imported 205-card library is fixture-backed for workflow shaping. Do not add persistence or caching tables until the clean-start Drizzle schema need is proven.
- Generated image binaries stay out of git; the imported card metadata preserves remote image URLs for the 200 image-backed cards.
- Keep Composer card preview CSS and Astra published-card CSS synced through shared `@astra/ui`; do not fork preview-only card styling unless a real operator-only state requires it.
- Keep operator metadata useful but secondary: queue state belongs on the Composer card, while tags/status detail should live in filters, side panels, or queue/detail surfaces instead of crowding the published-card preview face.
- Keep four-card grids reserved for wide screens in Composer; the normal operator shell should preserve card readability and full-art inspection over raw density.
- Queue publish currently uses a fixture-backed server adapter. Do not add persistence or cache tables for queue state until the clean-start scale boundary is specified.
- Batch publish can partially succeed because imported v1 cards still pass through clean-start voice/card validation. Treat "needs review" as an operator-safe result, not a transport failure.
- Query cache keys and queue plan ids are deterministic contract scaffolding; availability now has migration-owned collection/card tables, and selection is deterministic/read-only inside Journey but still needs product policy for persistence, seen state, completion, quiz attempts, certification, and eligibility rules.
- Server queue/cache persistence is now migration-owned, but Composer still uses the lightweight `local-operator` key until an approved admin auth/provider model exists.
- Offers and visual-language routes are intentionally retained as non-primary posture/workflow surfaces for now; next work should connect real collection/course actions only through clean-start contracts.
- The target-user private publish path remains as a dev-adjacent smoke path, but the strategic Composer model is publish-to-library/pool/course availability for Astra retrieval, not operator-to-user sending.

#### Next Copy/Paste Goal

Continue Composer v1 quarry rebuild from the real 78-card Astrology 101 course, direct `/cards/[cardId]` inspection route, and the migration-backed availability, eligibility, and Journey selection spine. Next, make individual card detail useful as a workbench control point: connect read-only detail inspection to collection/course membership, queue draft state, and future clean-start edit/version APIs without reviving v1 seed mutation, image-generation runtime, Supabase, or runtime DDL. Preserve Cards as workbench, Library as read-only inventory, Course as a generalizable course builder pattern, shared `@astra/ui` card rendering, neutral light/dark theming, i18n-only UI chrome, no image binaries in git, and verify Course/Library/Cards/card-detail plus Journey selection with browser QA.

### 2026-06-17 - Composer Operator App

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** clean-start Composer operator UI
**Status:** complete

#### What Changed

- Converted `apps/composer-web` from placeholder/library-only to a small Next.js operator app on port `3012`.
- Added Composer dashboard, review, onboarding, settings, API status, operator preview/publish, and onboarding publish routes.
- Kept Composer auth surface small: local preview by default, access-lock mode when `COMPOSER_REQUIRE_AUTH=1`, no Supabase carryover, and trusted writes through Astra's internal-token APIs.
- Added Composer-local i18n for route chrome, nav, form labels, status text, and theme labels; documented the i18n requirement in Composer docs and the root README.
- Added persisted light/dark Composer theming with a shell toggle.
- Updated stale Journey test selectors to target main stream-card buttons instead of social action buttons.

#### Tests Run

- `ak governance check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run check`
- `npm run test:composer-stream`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-private-feed-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-operator-workflow`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-onboarding-cards`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-onboarding-mobile`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:e2e`
- `npm --workspace apps/composer-web run build`
- Browser QA verified Composer `/`, `/review`, `/onboarding`, and `/settings` at desktop/tablet/phone, clicked Review publish and Onboarding publish, verified target-user private feed rows, verified signed-out `/journey` does not leak private QA cards, and checked Composer theme toggling with a clean Playwright browser.

#### Risks / Follow-ups

- Composer remains a local/internal operator surface. Add real admin auth only after the access model is explicitly approved.
- Composer still writes through Astra's existing trusted APIs; do not add runtime DDL or direct app-to-app imports.

### 2026-06-16 - Composer Onboarding Cards

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** Composer onboarding private-feed implementation
**Status:** complete

#### What Changed

- Added a Composer onboarding batch contract and `POST /api/composer/onboarding-cards` behind the internal API token.
- Added Composer-side onboarding card preparation from the working Astria onboarding set, projected as user-owned private Journey cards through the existing private-feed write contract.
- Replaced signed-out `/journey` sample data with a 12-card subset from Astria's 200 published Composer public cards and capped anonymous Journey to the current public preview.
- Kept signed-in first-run Journey private and empty until Composer publishes onboarding cards; no public preview cards are copied into private feeds.
- Added mobile-first Composer onboarding smokes using Mailpit, real auth, the trusted API route, privacy checks, console/page-error checks, and horizontal-overflow checks.

#### Tests Run

- `npm run check`
- `npm run test:e2e`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-onboarding-cards`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:composer-onboarding-mobile`
- Mobile route proof uses Playwright as the durable evidence per Akashic guidance; in-app browser was used only as a light visual sanity check.

#### Risks / Follow-ups

- Composer onboarding is still a deterministic workflow/helper plus trusted API route, not a rendered operator UI. Add visible Composer controls only when human editing of onboarding cards is needed.

### 2026-06-16 - Chart Generation Flow UX

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** chart/report generation UX
**Status:** complete

#### What Changed

- Added a compact chart generation flow map to `/self`: birth data -> chart queued -> report generated -> saved in Library.
- Moved generated report reading into a simple private report card with a Library link and publish-signal action.
- Made Library handoff explicit in `/self`; completed reports continue to persist as `report:<requestId>` artifacts.
- Kept automatic testing on the local deterministic writer and preserved the later alpha seam for chosen LLM writers.
- Used Mobbin pattern references for staged generation/status and compact result review, then chose a simpler card treatment for mobile-first alpha usability.
- Reverted the birth-date field to plain `YYYY-MM-DD` text input after rendered browser QA exposed native date-input state friction.

#### Tests Run

- `ak governance check`
- `npm run lint`
- `npm run typecheck`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:chart-request-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:report-api`
- `npm run test:place-search-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npx playwright test --config apps/astra-web/playwright.config.ts --project=desktop -g "signed-in self onboarding queues chart and report requests"`
- `npm run check`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:e2e`
- In-app browser `/self` chart flow QA through report generation, report card, Library route, tablet, and mobile with no horizontal overflow and no console error logs.

#### Risks / Follow-ups

- The report writer remains deterministic/local for automatic testing. Alpha can choose LLM writers later behind the existing writer boundary.
- The report card is intentionally scoped to private report detail; Composer still controls publishing user-owned Journey cards from explicit report signals.

### 2026-06-16 - Auth and Self Onboarding Alpha

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** auth/onboarding alpha hardening
**Status:** complete

#### What Changed

- Made the signed-in email-code panel actionable with direct `Continue to Self` and `Open Journey` actions.
- Simplified `/self` first-run report setup copy around the alpha path: subject and birth date are enough; time and place are optional precision.
- Added visible onboarding progress and date-only guidance while keeping the private chart/report request contract unchanged.
- Updated auth-related smokes to require Mailpit for OTP retrieval instead of falling back to file-captured email.

#### Tests Run

- `ak governance check`
- `npm run dev:status`
- `npm run test:auth-code`
- `npm run test:place-search-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:chart-request-api`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:report-api`
- `npm run check`
- `ASTRA_INTERNAL_API_TOKEN=astra-local-internal-token npm run test:e2e`
- In-app browser `/login` -> Mailpit OTP -> `/self` reload QA at desktop, plus `/self` tablet/mobile responsive checks with no horizontal overflow and no console error logs.

#### Risks / Follow-ups

- Production-like local smokes require `ASTRA_INTERNAL_API_TOKEN` in the shell environment when exercising trusted internal result APIs.
- The alpha path is now ready for LLM writer selection later; local deterministic writer remains the automatic testing route.

### 2026-06-16 - Journey Core Product Loop

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** core Journey loop
**Status:** complete

#### What Changed

- Made `/journey` explicit about signed-out public preview, signed-in first-run private empty state, and signed-in private ready state.
- Removed automatic copying of public fallback cards into signed-in private feeds.
- Clarified that Composer generates the first onboarding cards and remains the default private feed creation path.

#### Tests Run

- `npm run check`
- `npm run test:composer-operator-workflow`
- `npm run test:e2e`
- In-app browser `/journey` QA for signed-out public preview, first-run signed-in private empty state, and Composer-published signed-in private ready state at desktop/tablet/mobile.

#### Risks / Follow-ups

- Composer onboarding card generation is the intended product path; this slice only prevents Astra from substituting public fallback cards as private feed content.

### 2026-06-16 - Composer Operator Review Workflow

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** composer operator workflow
**Status:** complete

#### What Changed

- Added the first Composer-owned operator workflow for source-card draft -> preview -> target user -> private feed publish.
- Kept Composer independent from Astra internals by emitting `ComposerPrivateFeedWrite` through the existing trusted API contract.
- Added a deterministic operator draft fixture and validation for source cards, voice cards, explicit target user, preview payload, and decision trace.
- Added a smoke that proves repeat publish/idempotency, User A/User B ownership isolation, signed-out public fallback privacy, and signed-in `/journey` visibility.
- Fixed a tablet-width horizontal overflow found during rendered `/journey` QA.

#### Tests Run

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run check:boundaries`
- `npm run check:no-supabase`
- `npm run build`
- `npm run check`
- `npm run test:private-feed`
- `npm run test:composer-private-feed-api`
- `npm run test:composer-operator-workflow`
- `npm run test:e2e`
- In-app browser `/journey` QA at desktop/tablet/mobile with the operator QA card visible, no console errors, and no horizontal overflow.

#### Risks / Follow-ups

- Composer is still a library/operator workflow surface, not a visible admin UI. Add a rendered Composer route only when the operator tool needs human editing controls beyond deterministic draft/review helpers.

### 2026-06-16 - Composer Private Feed Write Edge

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** private-feed implementation
**Status:** complete

#### What Changed

- Added `ComposerPrivateFeedWrite` as the trusted Composer-to-Astra private Journey write contract.
- Added `POST /api/composer/private-feed-items` behind `x-astra-internal-token`.
- Added Composer-side private feed publisher helpers and a live API smoke.
- Routed signed-in report signal publishing through the private-feed contract/service instead of a direct feed write.

#### Tests Run

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run check:boundaries`
- `npm run test:composer-private-feed-api`
- `npm run test:private-feed`
- `npm run test:composer-ingest-api`
- `npm run test:report-api`

#### Risks / Follow-ups

- Build out Composer operator/review UI on top of the private write edge.
- Retain `/api/composer/stream-artifacts` only for public fallback/source-layer content until it can be retired or clearly scoped.

### 2026-06-16 - Stewardship v3 Install

**Report Level:** 3 - Workflow & QA View  
**Actor:** Codex  
**Session Type:** docs/governance setup  
**Status:** complete

#### What Changed

- Installed local Stewardship v3 pointer docs and reporting-level defaults.
- Captured initial system map, boundaries, risk register, and review checklist from repo evidence.
- Added first Steward review follow-up task.

#### Tests Run

- `ak governance check`

#### Risks / Follow-ups

- First formal Steward review task created and acknowledged.
- Run a formal Steward review of private feed, report generation, and Composer boundaries.
### 2026-07-30 - TypeScript 7 Normal Session and i18n Chrome Guard

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** i18n audit and TypeScript 7 adoption proof
**Status:** complete

#### What Changed

- Routed remaining app chrome in login, admin, and report disclosures through
  the Astra i18n dictionary while preserving canonical form/provider values.
- Added `npm run check:i18n` to prevent raw JSX chrome from returning.
- Recorded a normal post-edit TypeScript 7 session and made stale JCodeMunch
  refresh a documented closeout responsibility.

#### Tests Run

- `npm run check:i18n`
- `npm run typecheck` (0.94s final exact-diff run; 0.63s first run)
- `npm run check` (17.47s final exact-diff run; 17.77s first run)
- In-app browser QA at desktop/mobile for `/login`, logged-out `/library`, and
  the `/admin` redirect boundary; no console warnings/errors or overflow.

#### Steward Review

- Judgment: accept-with-notes.
- The i18n guard intentionally excludes technical `<code>` literals and API
  routes; authored/generated report content remains data, not interface chrome.
- No public/private, analytics, persistence, or report-generation boundary
  changed. The only observed framework note is Next.js's existing
  project-reference support warning.

### 2026-07-30 - Tiered Verification and Stable Auth E2E

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** verification performance and reliability
**Status:** complete

#### What Changed

- Added fast/static, focused browser, responsive, security, and release tiers
  with a change-to-test decision matrix.
- Enabled ESLint caching and replaced repeated OTP sign-ins with signed Better
  Auth test sessions after one real OTP contract.
- Isolated the production OTP rate-limit contract and hardened Journey durable
  state verification.

#### Tests Run

- `npm run check:fast` (2.50s)
- cached `npm run lint` (1.45s)
- `npm run check` (11.32s)
- production focused E2E tiers (14.20s to about 49s)
- production `npm run test:e2e:release` (45 passed, 6 intentionally skipped)
- production `npm run test:e2e:rate-limit` (fourth request returned 429)

#### Steward Review

- Judgment: accept.
- Production auth and rate-limit defaults remain enabled. Only the main
  exhaustive Playwright server disables the general Better Auth request window;
  a separate production-mode server proves throttling independently.
- No user-facing design, analytics, persistence schema, or public/private
  product boundary changed.

### 2026-07-31 - Synastry V3 Clean-Prose Blind Experiment

**Report Level:** 3 - Workflow & QA View
**Actor:** Codex
**Session Type:** private report-generation experiment
**Status:** complete

#### What Changed

- Generated two controlled Tony Cecala + Cheyenne Autumn `Lover` clean-prose
  variants from the same strongest-15 direct signal packet, with stable private
  evidence IDs and no saved-report writer input.
- Recorded Tony's human green light for *The Undertow of Recognition*, then
  revised the acceptance contract so instrumentation notes do not masquerade
  as reader failure.
- Generated V2 with feeling-first language. It remained green with one fatal
  category: fabricated Cheyenne dialogue and concrete invented biography.
- Added ±10% numeric assessment, the more-than-two-fatal rejection threshold,
  and separate evidence-coverage and semantic-support review.
- Generated one final synthesis against Undertow as a post-writer blind
  benchmark. It matched Undertow on four of five editorial scores, lost by one
  point on perspective balance, and confirmed Undertow as the accepted result.

#### Tests Run

- Targeted ESLint for the experiment runner
- TypeScript typecheck
- Clean-prose parser/evaluator self-test
- Signals-only direct-chart preflight and exact baseline packet comparison
- Private file-permission, technical-leakage, diff, and governance checks

Full build, broad test suite, and browser QA were intentionally skipped because
the experiment did not change production runtime, routes, data, or UI.

#### Steward Review

- Judgment: accept-with-notes.
- Green-light both private portraits as reader experiments. Keep Undertow as the
  human-approved clarity benchmark; treat V2's fabricated dialogue/biography as
  the single line to step behind while preserving its emotional density.
- The final synthesis remained green with one fatal category—italicized
  first-person speech attributed to Cheyenne—but did not improve the benchmark.
  Close the bakeoff with Undertow preferred and no additional retry.
- Production, saved reports, database state, and public/private product paths
  were unchanged.

## 2026-07-31 — Synastry V3 bakeoff closure and production plan

- Closed the private clean-prose bakeoff with *The Undertow of Recognition* as
  the accepted reader benchmark and retained strongest-15 direct chart signals
  as the production candidate; the complete inventory remains audit-only.
- Added an implementation-ready, non-production plan covering the six-chapter
  feeling-first writer, immutable owner-only Evidence drawers, all Ally tone
  routes including Lover, contextual leakage checks, and the ±10% / more-than-two
  editorial-fatal policy.
- Verified that the smallest path needs no SQL migration: existing Ally text,
  request context JSONB, and report generation-metadata JSONB can carry the
  compatible tag, tone, Evidence, trace, and acceptance snapshots. Production
  code, routes, data, and UI remain unchanged.
- Steward review: **accept**. The plan preserves the chart-calculation path,
  names the public-share Evidence leak as an implementation boundary, and
  defines proportional tests and browser journeys without running production
  verification during this documentation-only closeout.

## 2026-07-31 — Synastry V3 feeling-first production slice

- Promoted only new Synastry reports to the six-chapter feeling-first writer while preserving the existing direct cross-chart calculation and strongest-15-policy evidence jobs; saved reports and the complete-inventory experiment are not writer inputs.
- Added canonical non-Self Ally create/edit tags including Lover, owner-scoped PATCH, live server-side tone derivation, and immutable tone/Evidence/trace/validation metadata in the existing JSONB result field with no SQL migration or backfill.
- Added separate semantic-support evaluation, contextual leakage and fabricated-speech checks, the 1,350-1,650 review band, the approved two-category green / three-category retry policy, one corrective retry, and private rejected-attempt metadata.
- Owner readers now use stored V3 Evidence IDs; public shares omit Evidence, trace metadata, failures, private provenance, and internal review notes before rendering.
- Focused static, contract, engine, API, i18n, build, and desktop/tablet/mobile browser journeys passed. Existing reports were not rewritten and no broad release suite was run.
- Steward review: **accept**. Contracts, runtime guards, persistence, authenticated UI, and public/private projection moved together; no chart-calculation, SQL schema, natal/progressed, credit, or payment path changed.

## 2026-07-31 — Synastry V3.1.1 Michelle refinement

- Created one new immutable Tony + Michelle Lover report (`652dfffa-6cd3-49b7-9de5-73d5a4f59a2f`) from the same strongest-15 direct chart path and stable private Evidence IDs; no saved portrait or complete inventory entered the writer.
- Reduced visible technical astrology from 49 to 13 terms, 34.9 to 8.8 terms per 1,000 words, and 10 to 3 heavy paragraphs while keeping all 15 prose paragraphs in second person. Fixed the false Michelle perspective category by accepting her first name rather than requiring the exact stored full name.
- Tony accepted the result and preferred occasional aspect references that earn their paragraph over corrective prose quotas. The prompt now encodes that qualitative rule; the validator remains a private backstop against astrology-dominated writing and preserves the ±10% / more-than-two-fatal arithmetic.
- The report cost $0.153852 through OpenRouter/Claude Sonnet 4.6: one rejected attempt ($0.071088), the accepted pass (approximately $0.071223), and semantic review ($0.011541). Total generation latency was 191.616 seconds.
- Targeted packet, validator, engine, typecheck, ESLint, production build, and desktop/tablet/mobile owner/private-share boundary checks passed. Existing reports, Ally routing, chart calculation, schema, and public projection remain unchanged.
- Steward review: **accept-with-notes**. Editorial improvement is material and owner-approved; the stored report honestly retains its generation-time review metadata and is not rewritten after acceptance.
