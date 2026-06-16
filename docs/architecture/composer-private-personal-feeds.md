# Composer Private Personal Feeds

This architecture note promotes the re-orientation in `docs/inbox-astra/ASTRA_COMPOSER_PRIVATE_PERSONAL_FEED_DOCTRINE.md` into the active architecture set.

## Governing Phrase

Astra is not a newspaper. Composer privately assembles each user's next meaningful card from public source material, personal state, timing, progress, and explicit permissions.

## Correct Model

The Stream is the user's private journey. A shared public stream can exist for anonymous demo, broad atmosphere, educational samples, announcements, and fallback cards, but it is not the core product model.

```txt
Authenticated user
  -> private context
  -> Composer decision
  -> user-owned feed item
  -> Astra /journey display
```

`SourceCard` is not the feed. `UserFeedItem` is the feed.

## Ownership

- `apps/astra-web` owns authenticated user experience, private feed display, artifacts, library, gifts, stars, allies, and account state.
- `apps/composer-web` owns operator/admin composition tools, source-card creation, simulation, review queues, and composition controls.
- `packages/contracts` owns the treaty objects: `SourceCard`, `PublicStreamItem`, `UserFeedItem`, `ComposerDecision`, `PrivateFeedRequest`, and `PrivateFeedResponse`.
- `packages/db` owns schema and typed user-scoped accessors.
- `packages/astrology` owns deterministic astrology primitives and report generation boundaries, not feed ranking.

## Data Boundaries

Public-safe source material may be shared. Personalized feed projections are private and user-owned.

Composer may consider public source material, personal state, timing, progress, preferences, saved/dismissed content, gifts/stars, allies, artifacts, and explicit permissions. It must not leak one user's data into another user's feed, write feed rows without a user owner, rely on client-side filtering for privacy, or make a global "everyone sees the same thing" stream the core path.

## Required Private Feed Objects

- `SourceCard`: reusable canonical content ingredient.
- `PublicStreamItem`: optional shared/fallback item.
- `UserFeedItem`: private projection for exactly one user.
- `ComposerDecision`: private internal trace explaining why a feed item was created.
- `PrivateFeedRequest` / `PrivateFeedResponse`: authenticated read contracts.

## Implemented v0 Contract And Schema Split

The first private-feed boundary now exists in shared contracts, Drizzle schema, migration `0003_round_hellcat`, and database repository helpers.

- `packages/contracts` defines the source, public fallback, private feed item, decision trace, request, and response schemas.
- `packages/db` owns `source_cards`, `public_stream_items`, `user_feed_items`, and `composer_decisions`.
- `listUserFeedItems` and `getUserFeedItemById` require a `userId` in the database predicate.
- `createComposerDecision` verifies the target feed item belongs to the same user before writing the private audit record.
- `scripts/smoke-private-feed.mts` proves User A cannot read User B's item, public fallback rows do not carry private payload, and private feed responses do not expose decision internals.
- `/journey` now reads authenticated users from `UserFeedItem` rows. Signed-out readers see an explicitly labeled public fallback, not a personalized stream.
- Publishing a completed report signal creates a deterministic user-owned `report_signal` feed item for the signed-in user instead of making the global stream the product feed.

## v0 Access Rules

- Feed reads are mentally modeled as `getPrivateFeedForUser(authenticatedUserId)`.
- Every private feed row has `userId`.
- Anonymous users can read only public fallback content.
- Astra reads private feed rows through server-side accessors.
- Composer writes through explicit contracts and trusted service/admin routes.
- Composer decisions are not returned by default to the user-facing feed endpoint.

## Testing Bar

Do not ship the private feed model without privacy tests:

- User A can read User A feed item.
- User A cannot read User B feed item.
- Anonymous user cannot read private feed.
- Public feed contains no `userId` and no private payload.
- Composer decision records are not returned by Astra feed endpoints.
- Feed item creation requires an explicit `userId`.
- Client-side filtering is never the access-control boundary.
