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

The first operator workflow lives in `src/operatorWorkflow.ts`:

1. Validate a source-card draft and Composer voice card.
2. Preview the card without writing a user feed item.
3. Require an explicit target user.
4. Emit `ComposerPrivateFeedWrite` for the trusted Astra API.
