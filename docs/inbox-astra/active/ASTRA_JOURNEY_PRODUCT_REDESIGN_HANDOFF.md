---
title: "Astra Journey Product Redesign Handoff"
type: "codex-inbox"
project: "Astra Clean Start"
status: "ready-for-codex"
execution_state: "paused-by-owner"
priority: "P0"
owner: "Astra"
created: "2026-07-17"
mission: "Define what Journey is for, then rebuild the tab as Astra's coherent private ongoing experience."
depends_on:
  - "docs/architecture/composer-private-personal-feeds.md"
  - "docs/inbox-astra/ASTRA_COMPOSER_PRIVATE_PERSONAL_FEED_DOCTRINE.md"
  - "docs/operations/2026-07-16-alpha-milestones.md"
tags:
  - astra
  - journey
  - product-design
  - private-feed
  - composer
  - i18n
  - browser-qa
  - alpha
updated: "2026-07-20"
---

# Astra Journey Product Redesign Handoff

## Current Status

Reopened on 2026-07-20 because the prior completed marker was premature. The JourneyStep recommendation and product checkpoint exist, but this handoff's full implementation, acceptance criteria, and deployment evidence are not complete. Journey implementation is intentionally paused until Tony starts that work in a separate thread.

## 2026-07-20 Product Checkpoint

### Audit evidence

- Live signed-out `/journey` currently opens with “A living stream,” a first-private-run Composer message, six lanes, zero saved/reflected counters, and no cards. The page had no browser console errors; the failure is product coherence, not rendering health.
- Source confirms four competing modes share one reader: private feed, public sample/fallback, query-selected Composer cards, and legacy seeded cards.
- `StreamReader` exposes like, comment, save, reflect, audience, status, kind, and date language even though the interaction state is client-only and not durable.
- Root `/` and `/journey` still duplicate framing and signed-out handling.
- Browser assertions have drifted with the product: current tests expect twelve public cards while the active public contract returns four.

### Recommended model for Tony's confirmation

**Promise:** Journey is the private, ordered place where Astra gives you the next meaningful thing to notice or do.

**Primary object:** one `JourneyStep`, presented as a current focus with an optional short ordered queue behind it. It is not a general feed, lane browser, or social surface.

**First viewport:**

- Phone: Journey promise, one current step, one honest primary action, and a quiet “Up next” count only when more steps exist.
- Desktop/tablet: the same current step in the reading column, with a compact ordered queue beside it; no decorative card grid.

**Keep:** open/continue, complete, dismiss, and save only when each action persists. Use provenance through progressive disclosure (“Why this now?”), never debug metadata.

**Remove:** six lanes, like/comment controls, client-only counters, customer-facing audience/status/kind labels, and query-string course selection as a customer journey.

**Empty state:** explain that Journey becomes useful after the first chart/report event, then offer one truthful next action to create or open that artifact. If Composer is delayed, show the user's completed Astra artifacts rather than a fake feed.

**How events enter:** reports, Allies, achievements, gifts, and Composer lessons may create candidate steps through the existing private `UserFeedItem` projection. The ordered Journey view chooses the next relevant step; the originating artifact remains owned by Library, Self, Allies, or Gifts.

**Surface boundaries:** Journey owns sequence and next action. Library owns durable artifacts. Self owns the user's chart/profile. Allies owns relationship records. Gifts owns granted value. Signed-out `/` owns public product illustration; signed-out `/journey` should redirect to that illustration or login instead of imitating a private Journey.

### Implementation plan after approval

1. Write a short product/architecture decision defining `JourneyStep`, ordering rules, persistent actions, and public/private boundaries; prove whether `UserFeedItem` can express it before considering schema work.
2. Make `/journey` the single signed-in owner and `/` the single signed-out illustration; remove duplicated rendering and query-driven customer selection.
3. Replace `StreamReader` with a focused current-step reader plus ordered queue. Remove lanes, social fiction, debug metadata, and client-only state.
4. Implement only the approved durable mutations with user-scoped repository methods and authorization tests.
5. Define logged-out, empty, loading, provider/database unavailable, one-step, multi-step, and completed/dismissed states in i18n.
6. Update the analytics contract for step viewed/opened/completed/dismissed/saved events, or explicitly defer events that do not yet have durable behavior.
7. Repair stale browser assertions around the four-card public illustration and current report CTA, then add User A/User B privacy coverage for Journey mutations.
8. Verify `/`, `/journey`, navigation entry points, old query URLs, and adjacent tabs at phone/tablet/desktop; close this brief only after deployment evidence is recorded.

**Owner gate:** Tony confirms this model before schema changes or replacement of the Journey page architecture.

## Thread Mission

Develop the **Journey** tab next, in concept and code.

Journey should become Astra's useful ongoing experience between chart creation and report purchases. It must feel personal, calm, purposeful, and native to Astra. It must not read like a generic social feed, a news stream, a card demo, or an internal Composer debugger.

The next thread should first decide the smallest coherent Journey product model, then implement it end to end. Do not polish the current accidental feed model before deciding what the surface is for.

## Release Baseline

- `alpha` and `origin/alpha` are at `e6b3d2f`.
- Prompt v6 is deployed and outside this mission.
- Alpha is live at `https://alpha.astraportrait.com`.
- The report, chart, Self, Ally, Library, Stars, auth, and Welcome Report paths are working baselines. Preserve them.
- Start implementation from a fresh `codex/` branch based on current `alpha`.

## Governing Product Truth

The architecture doctrine is already settled:

> Astra is not a newspaper. Composer privately assembles each user's next meaningful card from public source material, personal state, timing, progress, and explicit permissions.

`SourceCard` is not the Journey. `UserFeedItem` is the private user-owned projection shown in Journey.

The open question is the customer experience: what should Journey help someone notice, understand, or do when they open Astra today?

## Current Product and Code Reality

The route currently combines several ideas:

- Authenticated private `UserFeedItem` rows.
- Signed-out Composer public samples with a seeded fallback.
- Query-driven Composer course selection.
- Report signals and manual/source/artifact/achievement/ally/gift feed kinds.
- Six lanes: All, Today, Know Yourself, Myth and Symbol, Practice, and Gift.
- Card detail, save, reflect, like, and comment-looking controls.
- Client-only save/reflect state that is not durable.
- Debug-style kind, audience, status, and date metadata.
- Separate render paths in `/` and `/journey` that partly duplicate the surface.

This breadth is not automatically a product. Several affordances currently imply persistence or social behavior that does not exist. Treat that as evidence to simplify, not as a requirement to implement every implied feature.

## First Decision Checkpoint

Before broad code edits, inspect the live signed-out and signed-in Journey and answer these questions in one concise recommendation for Tony:

1. What is the one-sentence promise of Journey?
2. What is the primary recurring object: a daily focus, a short sequence, a private feed, a practice queue, or something else?
3. What belongs in the first viewport on phone and desktop?
4. Which current lanes and actions have real customer value?
5. What should happen when a user has no private Journey items?
6. How should a report, Ally, achievement, gift, and Composer lesson enter Journey without turning it into a miscellaneous inbox?
7. Which behavior belongs in Journey versus Library, Self, Allies, or Gifts?

Present one recommended model, not a menu of competing redesigns. Use the smallest model that can grow later. Get Tony's product confirmation before changing schema or replacing the page architecture.

## Recommended Product Lens

Use this as the starting hypothesis, not a foregone conclusion:

> Journey is the private, ordered place where Astra gives the user the next meaningful thing to notice or do.

That suggests:

- One clear next item or short active sequence before a broad feed.
- A visible relationship between the item and the user's chart, reports, Allies, learning path, or recent action when that relationship is real.
- A small set of honest actions such as open, continue, save, reflect, complete, or dismiss.
- Durable state for any action that claims to be remembered.
- Progressive disclosure for provenance and internal details.
- Public signed-out samples as product illustration only, clearly separate from the private Journey.

## Non-Negotiable Boundaries

- Journey is private and user-scoped by default.
- Anonymous users may see only public-safe samples with no user identifiers or private context.
- Never depend on client-side filtering for privacy.
- Composer decision traces remain private internal data and are not customer prose.
- Astra renders; Composer composes; contracts define; the database persists.
- Do not import Composer app internals into Astra.
- Do not expose model names, ranking scores, debug labels, audience enums, or feed implementation language to customers.
- All UI labels, errors, empty states, loading states, action names, and accessibility text flow through i18n.
- Do not disturb the five-tab navigation. Journey remains the first tab.
- Do not change report prompts, report pricing, chart calculations, or the Welcome Report in this mission.
- Do not add a new schema until the approved Journey model proves the current `UserFeedItem` contract cannot express it cleanly.

## YAGNI Watch List

Do not automatically build:

- A social network.
- Comments, reactions, follower counts, or public profiles.
- A large taxonomy of lanes.
- Infinite scroll.
- Hidden AI personalization claims without inspectable source context.
- A second Library inside Journey.
- A customer-facing Composer configuration screen.
- Gamification, streaks, or notifications without a proven product need.
- A compatibility layer for controls removed during the redesign.

If the final concept does not need the current like/comment/save simulation, remove it instead of making the fiction more elaborate.

## Primary Code Map

- `apps/astra-web/app/journey/page.tsx`: Journey route and current state framing.
- `apps/astra-web/app/journey/loading.tsx`: loading state.
- `apps/astra-web/app/page.tsx`: root route's partly duplicated Journey rendering.
- `apps/astra-web/lib/journey.ts`: private/public/Composer selection view-model assembly.
- `apps/astra-web/components/StreamReader.tsx`: lanes, cards, detail, and simulated actions.
- `apps/astra-web/lib/i18n.ts`: all current Journey UI language.
- `apps/astra-web/lib/composer-selection.ts`: Composer availability and selection boundary.
- `apps/astra-web/lib/public-composer-preview.ts`: public sample projection.
- `packages/contracts`: `UserFeedItem`, source/public feed, decision, and Composer selection contracts.
- `packages/db`: user-scoped feed accessors and persistence.
- `apps/astra-web/e2e/foundation-routes.spec.ts`: current route and privacy coverage.
- `docs/architecture/composer-private-personal-feeds.md`: active architecture boundary.

Use `akashic/repomaps/current.md` first, then targeted source reads. Quarry `/Users/tony/Documents/Projects/Astria` only for proven Journey behavior worth preserving; do not migrate its architecture wholesale.

## Product Design Inputs

Before implementation, read:

- `akashic/playbooks/astra-composer-product-design-patterns.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/README.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/audits/ASTRA_DARK_PATTERN_GUARDRAILS.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/metrics/ASTRA_PATTERN_ANALYTICS_EVENTS.md`

Name the relevant pattern files in the implementation closeout. Use Mobbin for strong mobile-native patterns when external comparison is useful.

## Required States

Define and verify these as product states, not generic error cards:

1. Signed-out public illustration.
2. Signed-in first visit with no private items.
3. Loading.
4. Composer or database unavailable.
5. One clear next item.
6. Multiple ordered items or an active sequence, if the approved model needs them.
7. Completed, saved, dismissed, or reflected state only for actions the system actually persists.
8. A new report signal or other real Astra event entering Journey.

## Implementation Sequence

1. Audit the live route and the current data flow in browser and source.
2. Write the one-sentence product promise and recommended information architecture.
3. Confirm the concept with Tony before schema or broad component work.
4. Define the minimal view model and interaction contract.
5. Remove controls, lanes, metadata, and duplicate rendering that do not serve the approved model.
6. Implement honest durable actions only where the experience requires them.
7. Keep public sample and private Journey projections explicitly separate.
8. Update i18n, empty/loading/error/success states, and accessibility behavior.
9. Add focused contract, data-boundary, and interaction tests.
10. Verify the complete Journey in a rendered browser and commit the scoped change.

## Acceptance Criteria

- A user can explain what Journey is for after seeing the first viewport.
- The primary action is obvious without instructional copy.
- The page does not expose feed implementation or debug metadata.
- Every visible action is real, durable where implied, and recoverable.
- Signed-out content is clearly public illustration; signed-in content is private and user-owned.
- User A cannot read or mutate User B's Journey items.
- Empty, loading, error, one-item, multi-item, and completed states are coherent.
- Root and `/journey` have one intentional ownership model rather than duplicated page implementations.
- Phone layout has no horizontal overflow and keeps the primary item/action visible.
- Tablet and desktop use the extra space to improve reading and navigation, not to add decorative cards.
- No regression to Self, Allies, Library, Gifts, auth, Stars, chart creation, or report ordering.
- Analytics use the existing project event contract, or the closeout explicitly marks analytics N/A.

## Verification Bar

Use `astra-browser-qa`.

- Run lint, typecheck, affected tests, and production build.
- Exercise the actual Journey interaction path, not only direct route loads.
- Check 390 x 844, 820 x 1180, and 1440 x 900 when layout changes.
- Review console, page errors, failed network calls, hydration, overflow, focus, and keyboard behavior.
- Verify signed-out, User A, and User B boundaries with real auth helpers or documented test fixtures.
- Sweep `/`, `/journey`, navigation entry points, old query-driven Composer selection URLs, and adjacent tabs for dangling behavior.
- Scale browser coverage to the edited risk; do not run unrelated browser matrices for ceremony.

## Completion Artifacts

- Updated Journey product/architecture decision.
- Implemented route, view model, components, contracts, and persistence changes required by the approved model.
- Focused tests and browser QA evidence.
- Updated or superseded Journey inbox/doctrine notes where the accepted model changes them.
- This brief marked completed or superseded and moved to `docs/inbox-astra/completed/` with commit and deployment evidence.
- One scoped commit or a small intentional commit series on a `codex/` branch. Do not commit QA screenshots.

## Starting Prompt For The New Thread

```text
Read docs/inbox-astra/active/ASTRA_JOURNEY_PRODUCT_REDESIGN_HANDOFF.md and make it happen. Begin by auditing the live and local Journey experience, its private/public data flow, and the current UI. Recommend one smallest coherent product model for Tony's confirmation, then implement the approved Journey end to end with i18n, honest durable actions, privacy tests, proportional browser QA, documentation, and a scoped commit. Preserve the five-tab navigation and all working chart/report paths. Do not turn Journey into a social network or polish controls that the product does not need.
```
