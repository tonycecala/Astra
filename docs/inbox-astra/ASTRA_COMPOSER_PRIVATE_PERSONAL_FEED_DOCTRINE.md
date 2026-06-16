---
title: "Astra Composer Private Personal Feed Doctrine"
project: "Astra / Composer / Akashic"
doc_type: "architecture-doctrine"
status: "foundational-correction"
created: "2026-06-16"
audience:
  - Codex
  - senior engineering agents
  - Astra maintainers
  - Composer maintainers
supersedes:
  - "Any interpretation of Composer as only a public stream broadcaster"
related_docs:
  - "ASTRA_CLEAN_START_INAUGURAL_CHARTER.md"
  - "Composer Repo Structure.txt"
tags:
  - astra
  - composer
  - private-feed
  - personalization
  - architecture
  - privacy
  - contracts
  - clean-start
---

# Astra Composer Private Personal Feed Doctrine

## 0. Executive Correction

Composer is **not** merely a public stream broadcaster.

Composer may operate on public source material, shared daily cards, transits, weather, announcements, campaigns, and educational sequences, but its core mission is deeper:

> Composer composes a private, personalized, ethically bounded feed for each authenticated Astra user.

The clean-start charter correctly describes Astra as personal and as a symbolic operating system for the self, but the phrase “RSS-like card/feed reader” can mislead engineering agents into building a generic public broadcast feed. This document corrects that interpretation.

Astra is not a newspaper.
Composer is not a megaphone.
The Stream is not only “today’s public cards.”

Astra is a personal symbolic instrument.
Composer is the watchmaker that assembles the next meaningful card for a specific person at a specific moment.

---

## 1. Non-Negotiable Doctrine

### 1.1 The core product experience is private and personal

The real Astra experience is:

```txt
Authenticated user → private context → Composer decision → private feed item → Astra stream display
```

Not:

```txt
Admin publishes public item → everyone sees same item
```

A public stream can exist, but it is a secondary layer:

| Layer | Purpose | Personal? | Private? |
|---|---|---:|---:|
| Public stream | Anonymous demo, shared daily atmosphere, fallback content | No | No |
| Source library | Canonical cards, prompts, lessons, offers, transits | No | No |
| Private user feed | Actual Astra journey | Yes | Yes |
| Artifacts / Library | Saved personal outputs and generated reports | Yes | Yes |
| Composer audit trail | Internal decision evidence and ranking trace | Yes | Private internal |

### 1.2 “Public product” does not mean “public data”

The clean-start docs describe `apps/astra-web` as the public user-facing app. That means public-facing **interface**, not public shared feed data.

Correct language:

```txt
apps/astra-web = user-facing product surface
apps/composer-web = internal operator/admin surface
private feed data = authenticated user-owned product data
```

Incorrect language:

```txt
apps/astra-web = public stream app
apps/composer-web = publisher of one shared stream
```

### 1.3 The default feed query must be user-scoped

Every Astra feed read should be mentally modeled as:

```txt
getPrivateFeedForUser(authenticatedUserId)
```

Not:

```txt
getStreamItems()
getTodaysStream()
getPublishedCards()
```

If a function name does not make the user boundary obvious, rename it.

---

## 2. Corrected Product Model

The clean-start product model starts with:

```txt
User
StreamItem
Card
Achievement
Ally
Artifact
Gift
StarTransaction
```

That is directionally correct, but `StreamItem` needs sharper subdivision so agents do not flatten personal feed architecture into broadcast architecture.

### 2.1 Revised first-class nouns

```txt
User
SourceCard
PublicStreamItem
UserFeedItem
ComposerDecision
Achievement
Ally
Artifact
Gift
StarTransaction
```

### 2.2 Noun definitions

| Noun | Meaning |
|---|---|
| `User` | Authenticated Astra person with profile, preferences, progress, and private state. |
| `SourceCard` | Reusable canonical content unit. Not inherently personal. |
| `PublicStreamItem` | Optional shared item visible to anonymous or broad audiences. |
| `UserFeedItem` | Private feed projection for exactly one user. This is the main Stream object. |
| `ComposerDecision` | Internal trace of why a user received a feed item. Not displayed directly. |
| `Achievement` | User-owned record of progress or meaningful action. |
| `Ally` | User-owned or globally available guide/person/archetype/companion relationship. |
| `Artifact` | User-owned saved output, report, reflection, note, session summary, or generated object. |
| `Gift` | Reward, purchase, unlock, or symbolic value object. |
| `StarTransaction` | User-owned accounting record for stars. |

### 2.3 Critical distinction

A `SourceCard` is not the feed.

A `UserFeedItem` is the feed.

Composer may choose a `SourceCard`, adapt it to the user’s context, attach a prompt, connect it to an achievement, point toward an artifact, invite an ally action, or sequence it as part of a learning path. The feed item belongs to the user.

---

## 3. Composer Mission

Composer exists to answer this question:

> Given this user’s identity, progress, permissions, timing, preferences, saved artifacts, stars, allies, and recent interactions, what should Astra show next?

Composer is allowed to consider:

- onboarding state
- natal chart primitives, when available and explicitly permitted
- current sky/transit primitives
- completed lessons
- saved cards
- skipped cards
- dismissed themes
- achievements
- ally relationships
- artifacts/library state
- gift/star state
- explicit preferences
- recent user behavior
- cadence and fatigue
- seasonal/daily timing
- ethical safety rules
- content freshness
- sequence position
- operator-approved campaigns

Composer must not:

- expose internal ranking machinery to Astra prose
- leak one user’s data into another user’s feed
- use private data in public stream items
- rely on hidden fuzzy matching when exact user context is required
- silently substitute sibling users, sibling sessions, or stale feed projections
- make privacy depend on client-side filtering
- build a global “everyone sees the same thing” stream as the core path

---

## 4. Architecture Shape

### 4.1 Boundary-preserving flow

```txt
apps/composer-web
  operator/admin tools
  source-card creation
  campaign staging
  review queues
  simulation tools
      ↓ explicit contracts only
packages/contracts
  SourceCard
  PublicStreamItem
  UserFeedItem
  ComposerDecision
      ↓ typed DB access
packages/db
  source_cards
  public_stream_items
  user_feed_items
  composer_decisions
      ↓ authenticated read
apps/astra-web
  private stream display
  self/account display
  library/artifacts
  allies
  gifts/stars
```

Astra consumes feed projections.
Astra does not import Composer reasoning.
Composer produces feed projections.
Composer does not leak internal state into Astra UI.

### 4.2 Package ownership

| Package/app | Owns | Must not own |
|---|---|---|
| `apps/astra-web` | Authenticated user experience and private feed display | Composer internals, ranking, admin workflows |
| `apps/composer-web` | Authoring, curation, simulation, review, composition controls | User-facing Astra page logic |
| `packages/contracts` | Type/Zod treaty for feed objects and decisions | Business leakage from either app |
| `packages/db` | DB schema and safe typed access | App-specific hidden coupling |
| `packages/astrology` | Pure deterministic astrology primitives | Feed ranking, DB access, React UI |
| `packages/testkit` | Factories and privacy test helpers | Production business logic |

---

## 5. Data Model v0

This is a practical v0 schema direction, not a final migration file.

### 5.1 `source_cards`

Canonical reusable content.

Fields:

- `id`
- `slug`
- `title`
- `body_template`
- `card_type`
- `topic_tags`
- `symbolic_tags`
- `eligibility_rules`
- `safety_flags`
- `status`
- `created_at`
- `updated_at`

Notes:

- Source cards are not user-private unless explicitly derived from private material.
- They are ingredients, not the user’s final stream.

### 5.2 `public_stream_items`

Optional public/fallback/shared items.

Fields:

- `id`
- `source_card_id`
- `publish_at`
- `expires_at`
- `audience_scope`
- `status`
- `created_at`
- `updated_at`

Rules:

- Must contain no private user payload.
- Can be visible to anonymous visitors.
- Can be used as fallback when a user has insufficient private context.

### 5.3 `user_feed_items`

The core private feed projection table.

Fields:

- `id`
- `user_id`
- `source_card_id` nullable
- `artifact_id` nullable
- `achievement_id` nullable
- `ally_id` nullable
- `gift_id` nullable
- `feed_kind`
- `title`
- `body`
- `display_payload`
- `rank_score`
- `reason_code`
- `state`
- `available_at`
- `expires_at`
- `seen_at`
- `dismissed_at`
- `saved_at`
- `created_at`
- `updated_at`

Rules:

- Every row belongs to exactly one `user_id`.
- All reads require authenticated user ownership.
- The UI reads this table through server-side accessors only.
- No client should fetch all feed items and filter locally.

### 5.4 `composer_decisions`

Private internal audit trail.

Fields:

- `id`
- `user_id`
- `user_feed_item_id`
- `decision_version`
- `input_context_hash`
- `candidate_ids`
- `selected_candidate_id`
- `rank_features`
- `suppression_reasons`
- `safety_notes`
- `created_at`

Rules:

- Not displayed directly to users.
- Useful for debugging, audits, reproducibility, and “why did this appear?” explanations.
- May support a sanitized user-facing explanation later, but never raw internal machinery.

---

## 6. Privacy and Security Doctrine

### 6.1 v0 security model

Use the boring, correct foundation first:

```txt
HTTPS transport
Better Auth session
server-side authorization
user_id tenancy
typed DB accessors
strict tests
no client-side privacy filtering
```

The key privacy control is not “the feed URL is hard to guess.”
The key privacy control is authenticated ownership enforcement on every read and write.

### 6.2 Public/private key idea

Public/private key architecture may become useful later, but it should not be the v0 feed architecture.

Use keys later for:

- encrypted private journals
- exportable user vaults
- signed feed exports
- client-side encrypted artifacts
- high-trust portability
- “Akashic archive” bundles

Do not use public/private keys in v0 for:

- normal feed routing
- basic user ownership
- standard app authorization
- replacing session auth
- hiding weak server access rules

Reason:

- HTTPS already encrypts transport.
- Session auth establishes who the user is.
- Database tenancy establishes what the user may access.
- Key management adds complexity, recovery risk, device-sync issues, and support burden.

The permanent rule:

> Cryptography can strengthen a correct privacy model. It cannot rescue a confused ownership model.

### 6.3 Optional future encryption tiers

| Tier | When to use | Complexity |
|---|---|---:|
| HTTPS + DB tenancy | v0 private feed | Low |
| Field-level server encryption | Sensitive private artifacts | Medium |
| Client-side encryption | User vaults/journals/exports | High |
| Public/private signed bundles | Portable Akashic records | High |

---

## 7. Contract Corrections

### 7.1 Add explicit feed contracts

`packages/contracts` should include at least:

```txt
source-card.contract.ts
public-stream-item.contract.ts
user-feed-item.contract.ts
composer-decision.contract.ts
feed-request.contract.ts
```

### 7.2 Example conceptual contracts

Use these names even if implementation details vary:

- `SourceCardSchema`
- `PublicStreamItemSchema`
- `UserFeedItemSchema`
- `ComposerDecisionSchema`
- `PrivateFeedRequestSchema`
- `PrivateFeedResponseSchema`

### 7.3 Naming ban list

Avoid ambiguous names for authenticated feed reads:

- `getStreamItems`
- `getFeed`
- `getTodaysCards`
- `getPublishedItems`
- `listStream`

Prefer names that encode privacy:

- `getPrivateFeedForUser`
- `listUserFeedItems`
- `composeUserFeedItem`
- `projectUserFeedForDisplay`
- `assertUserOwnsFeedItem`

---

## 8. API Shape

### 8.1 Astra feed read

```txt
GET /api/feed/private
```

Server behavior:

1. Read authenticated session.
2. Resolve `user_id`.
3. Query only `user_feed_items` for that `user_id`.
4. Return display-safe payload.
5. Never return Composer internals by default.

### 8.2 Public fallback read

```txt
GET /api/feed/public
```

Server behavior:

1. Read public stream items only.
2. Return no private payload.
3. Use for unauthenticated demo, marketing, or empty-state fallback.

### 8.3 Composition trigger

```txt
POST /api/composer/compose-user-feed
```

Server behavior:

1. Admin/operator or trusted job only.
2. Accepts target user or batch scope.
3. Builds candidate set.
4. Applies rules/ranking/suppression.
5. Writes `user_feed_items`.
6. Writes `composer_decisions`.
7. Returns operational summary.

This route belongs behind admin/job auth. Astra users should not be able to invoke arbitrary feed composition unless a carefully bounded “refresh my feed” product action is added later.

---

## 9. Personalization Inputs v0/v1

### 9.1 v0 inputs

Start with a small stable set:

- user onboarding state
- explicit preferences
- saved/dismissed cards
- completed achievements
- library/artifact counts
- ally count/state
- current date/time
- simple chart availability flag
- public daily source cards

### 9.2 v1 inputs

Add after privacy tests are solid:

- detailed chart signals
- transit relevance
- course progress
- reflection history
- gift/star patterns
- content fatigue rules
- “do not show me this theme” preferences
- sequence-aware journeys

### 9.3 Do not add yet

Avoid these until the base model is provably safe:

- opaque AI recommender loops
- aggressive behavioral profiling
- cross-user collaborative filtering
- sponsor-driven personalization
- hidden psychological scoring
- unreviewable feed mutation

---

## 10. Testing Requirements

### 10.1 Privacy tests are mandatory

At minimum:

```txt
User A can read User A feed item.
User A cannot read User B feed item.
Anonymous user cannot read private feed.
Public feed contains no user_id and no private payload.
Composer decision records are not returned by Astra feed endpoints.
Feed item creation requires an explicit user_id.
Client-side filtering is not used as an access-control boundary.
```

### 10.2 Determinism tests

Composer should support replayable decisions:

```txt
Given same user context snapshot and same source library version,
Composer produces the same candidate decision summary,
unless randomness is explicitly seeded and recorded.
```

### 10.3 Boundary tests

```txt
apps/astra-web must not import apps/composer-web.
apps/astra-web must not import Composer-only modules.
packages/contracts must not import app code.
packages/db must expose user-scoped feed accessors.
```

### 10.4 Red-team test cases

- forged feed item ID from another user
- stale session
- anonymous request
- admin-only route called by normal user
- public stream item accidentally includes private body
- public card derived from private artifact
- user deletes/dismisses content but it reappears immediately
- Composer writes a feed item without a user owner

---

## 11. Product Implications

### 11.1 The public stream is still useful

The public layer can provide:

- daily shared atmosphere
- educational samples
- anonymous demo mode
- public announcements
- general astrology/weather/transit notes
- fallback cards

But the public layer must not define the product’s soul.

### 11.2 The private feed is where Astra becomes Astra

The private feed can say:

- “You saved this card last week; here is the next step.”
- “Your library has three unfinished artifacts; one wants attention.”
- “You added your first Ally; here is a reflection to make that relationship useful.”
- “You completed a lesson sequence; here is the achievement it unlocked.”
- “Today’s sky matters because of what you have already told Astra and what you are studying now.”

That is the difference between a feed and a journey.

---

## 12. Codex Implementation Directive

Codex: treat this as a foundational correction.

### 12.1 Update docs

Add this document to:

```txt
docs/architecture/composer-private-personal-feeds.md
```

Then add pointers from:

```txt
docs/README.md
docs/architecture/README.md
ASTRA_CLEAN_START_INAUGURAL_CHARTER.md or an adjacent ADR
```

### 12.2 Amend the charter language

Replace or qualify any phrase that implies the Stream is only RSS-like broadcast content.

Suggested corrected language:

```txt
Stream = a private, personalized user feed composed from source cards, user state, timing, achievements, allies, artifacts, and optional public fallback content.
```

Suggested footnote:

```txt
“RSS-like” describes the calm card-reading interaction pattern, not the data ownership model. Astra’s core stream is authenticated, user-scoped, and private by default.
```

### 12.3 Implement contract split

Create or adjust contracts:

```txt
SourceCard
PublicStreamItem
UserFeedItem
ComposerDecision
PrivateFeedRequest
PrivateFeedResponse
```

### 12.4 Implement schema split

Create or adjust tables:

```txt
source_cards
public_stream_items
user_feed_items
composer_decisions
```

### 12.5 Implement safe accessors

Required DB helpers:

```txt
listUserFeedItems(userId, options)
getUserFeedItemById(userId, feedItemId)
createUserFeedItem(inputWithUserId)
listPublicStreamItems(options)
assertUserOwnsFeedItem(userId, feedItemId)
```

### 12.6 Add tests before UI polish

Do not ship the private feed model without privacy tests.

Required test file themes:

```txt
private-feed-access.test.ts
public-feed-safety.test.ts
composer-boundary.test.ts
user-feed-contract.test.ts
```

---

## 13. Anti-Patterns to Delete on Sight

Delete or rewrite any implementation that does this:

```txt
SELECT * FROM stream_items WHERE status = 'published'
```

as the main user feed.

Delete or rewrite any route that:

- returns all stream items to the client
- relies on the client to filter by user
- stores personalized copy in public stream rows
- has no `user_id` on private feed rows
- names public app surface as public data ownership
- lets Astra import Composer ranking internals
- lets Composer mutate user-facing state without a contract

---

## 14. Senior Engineering Verdict

The clean-start docs are mostly correct in spirit:

- small modules
- clean schema
- no Supabase fossils
- typed contracts
- Composer hidden behind explicit contracts
- Astra as user-facing surface

The dangerous drift is a single conceptual compression:

```txt
personalized symbolic reader → RSS-like stream → public stream
```

That compression must be stopped now.

Correct compression:

```txt
personalized symbolic reader → private user feed → public fallback/source library only where appropriate
```

The Stream is the user journey.
The journey is private.
Composer composes that journey.

---

## 15. Final Governing Phrase

Use this phrase in future architecture reviews:

> Astra is not a newspaper. Composer privately assembles each user’s next meaningful card from public source material, personal state, timing, progress, and explicit permissions.

