# Composer

Composer is intentionally lean in the clean-start foundation. It does not render Astra routes or import Astra app internals.

Composer will compose private, user-scoped feed projections through explicit contracts. Astra will consume those projections without importing Composer internals.

Astra is not a newspaper. Public/shared cards are source or fallback material; the core stream is a private personal feed assembled from public source material, personal state, timing, progress, and explicit permissions.

Composer UI chrome belongs in the local i18n dictionary before it appears in route components: navigation labels, route headings, button text, form labels, status text, and empty/error/loading copy should not be scattered as hardcoded route strings.

Local Composer review should run through the repo-owned durable launcher:

```bash
npm run composer:up
npm run composer:status
npm run composer:restart
npm run composer:stop
npm run composer:logs
```

`npm run composer:dev` remains available for short foreground iteration, but it is not the handoff path. Durable status must prove both a listener on `3012` and a healthy Composer route response.

The primary operator workflow lives in the Cards/Course/Drafts queue:

1. Select cards from Composer inventory.
2. Mark cards reviewing, approved, or held.
3. Check the approved selection without writing to the pool.
4. Publish approved cards into Composer availability for Astra per-user selection.

Legacy private-feed contract helpers remain available for lower-level tests, but they are not the primary Composer UI path.
