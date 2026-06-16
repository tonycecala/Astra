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

## Current Transitional Boundary

The clean-start implementation still reads from Astra-owned Postgres tables through `readFoundationSnapshot` and stores Composer-shaped cards in `cards` / `stream_items`. Treat that as a transitional foundation, not the final feed architecture.

Composer artifacts remain explicit contract payloads. A report-derived artifact may be created from `AstrologyReportPublicSignal`, but the actual stream projection shown to a user should become a user-owned `UserFeedItem` selected from public source material plus private user context. Raw private report sections, full provenance, birth data, engine payloads, navigation history, preferences, and progress must not be stored in public fallback rows.

## Caching Rule

The first production read model must split cache domains:

- public fallback/source content can use shared cache tags,
- private user feed projections must be user-scoped and auth-gated,
- Composer decisions are private internal audit records,
- private reports, chart requests, chart results, user-owned artifacts, navigation state, preferences, and progress remain auth-gated origin reads unless a deliberately private user-scoped cache is added.

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

These objects now exist as v0 shared contracts and database tables. `/journey` now uses the authenticated `UserFeedItem` read model for signed-in users and labels signed-out content as public fallback. The remaining product work is to move Composer's active composition/write path fully onto private feed projections instead of transitional source/fallback records.

Mandatory access rules:

- Every `UserFeedItem` has exactly one `userId`.
- Every private feed read is authenticated and server-side user-scoped.
- No client-side filtering is used as a privacy boundary.
- Composer does not read arbitrary user tables directly from Astra UI code.
- Astra does not import Composer ranking internals.
