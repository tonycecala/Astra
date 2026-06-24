# Private Personal Feed Read Model And Cache Boundary

## Foundational Correction

Astra is not a newspaper. Composer privately assembles each user's next meaningful card from public source material, personal state, timing, progress, and explicit permissions.

`/journey` is the private user stream by default. Public/shared stream records may exist for anonymous demo, shared atmosphere, educational samples, announcements, or fallback content, but they are not the core product feed.

The corrected mental model is:

```txt
authenticated user -> private context -> Composer decision -> user_feed_item -> Astra stream display
```

not:

```txt
published card -> everyone sees the same stream
```

## Current Boundary

Signed-in `/journey` reads `UserFeedItem` projections from Astra-owned Postgres through authenticated server-side accessors. Signed-out `/journey` reads public fallback/source content from the foundation stream.

Composer's card queue publishes reviewed cards into shared availability pools. Astra then selects each user's subset from availability using user/path/preference context. Separate report-derived private feed writes may still travel through `ComposerPrivateFeedWrite` and the trusted `POST /api/composer/private-feed-items` edge, but queue publishing must not create one-user feed rows.

## Caching Rule

The first production read model must split cache domains:

- public fallback/source content can use shared cache tags,
- private user feed projections must be user-scoped and auth-gated,
- Composer decisions are private internal audit records,
- private reports, chart requests, chart results, user-owned artifacts, navigation state, preferences, and progress remain auth-gated origin reads unless a deliberately private user-scoped cache is added.

Composer card-library queries are public-safe operator working-set reads, not private feed projections. The query route may return a deterministic cache key for near-term edge caching, but it must not use Postgres as a page-window cache. Database durability is reserved for human review state, publish plans, and approved availability collections.

Composer persistence is split by product necessity:

- Necessary now: Composer availability collections, user-owned feed projections, and operator draft state that protects in-progress review work.
- Useful now: publish-plan persistence when a batch needs review before commit.
- Not necessary now: persisted query-window caches in Postgres.
- Future boundary: edge caching for public-safe Composer card-library query results, keyed by query fingerprint and invalidated when source card content changes.

Future cache tags should be scoped narrowly:

- `feed:user:<userId>` for one user's private feed projection.
- `feed:item:<userFeedItemId>` for one user-owned feed item.
- `source-card:<sourceCardId>` for reusable public-safe source material.
- `public-stream` for anonymous/shared fallback only.
- `report-signal:<reportId>` only for the approved boundary signal, never raw report results.

## Failure Rule

No hidden fallbacks. If the private feed origin read fails, the app shows an explicit private-stream unavailable state. Public fallback content can be shown only when the product state intentionally chooses fallback and labels it as non-personalized; it must not masquerade as the user's composed journey.

Private/user-owned feed data must not be substituted from public cache. Public fallback data must not be personalized with private context.

## Invalidation Rule

Composer writes should invalidate the specific user feed tags for affected users and source-card tags for public-safe source changes. Report-result writes should not publish to the feed directly unless a separate Composer decision creates a user-owned feed projection from an approved boundary object.

## Required Next Architecture

The private feed implementation should add or evolve these first-class objects:

- `SourceCard`: reusable public-safe content ingredient.
- `PublicStreamItem`: optional anonymous/shared fallback item.
- `UserFeedItem`: private feed projection for exactly one authenticated user.
- `ComposerDecision`: private internal decision trace.
- `PrivateFeedRequest` / `PrivateFeedResponse`: authenticated feed read contracts.

These objects now exist as v0 shared contracts and database tables. `/journey` now uses the authenticated `UserFeedItem` read model for signed-in users and labels signed-out content as public fallback. Composer now has a trusted private-feed write edge; the remaining product work is to build out Composer's operator UI/review workflow on top of that edge and retire any product dependence on the transitional global stream publish path.

Mandatory access rules:

- Every `UserFeedItem` has exactly one `userId`.
- Every private feed read is authenticated and server-side user-scoped.
- No client-side filtering is used as a privacy boundary.
- Composer does not read arbitrary user tables directly from Astra UI code.
- Astra does not import Composer ranking internals.
