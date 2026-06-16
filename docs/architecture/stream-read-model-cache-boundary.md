# Stream Read Model And Cache Boundary

## Current Boundary

`/journey` reads from Astra-owned Postgres tables through `readFoundationSnapshot`. Composer writes public stream artifacts only through `/api/composer/stream-artifacts` with `x-astra-internal-token`; Astra persists the resulting `cards` and `stream_items`. Private report requests/results stay behind authenticated report APIs and are not read by `/journey`.

Report-derived cards enter the stream only as `ComposerStreamArtifact` records generated from `AstrologyReportPublicSignal`. The public signal is the boundary object: it can carry headline, summary, tone, report type, and a provenance summary, but it must not carry raw private report sections, full provenance, birth data, or engine payloads.

## Caching Rule

The first production read model should cache only public stream records: published `cards` joined to `stream_items`, ordered by stream position and filtered by audience/status. Private reports, chart requests, chart results, and user-owned artifacts remain auth-gated origin reads.

Future cache tags should be scoped narrowly:

- `stream:public` for the public published stream list.
- `stream:item:<streamItemId>` for a single public stream item.
- `card:<cardId>` for public card content.
- `report-signal:<reportId>` only for the approved public signal, never raw report results.

## Failure Rule

No hidden fallbacks. If the origin read fails, the app shows the explicit `/journey` stream-unavailable state. A future edge cache may serve a previously published public stream only when it is marked as such and the origin failure is surfaced through observability; private/user-owned report data must not be substituted from public cache.

## Invalidation Rule

Composer ingest should invalidate public stream tags when it creates or updates a public stream artifact. Report-result writes should not invalidate the public stream directly unless a separate Composer publish step emits an approved `AstrologyReportPublicSignal`.
