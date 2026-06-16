# Composer

Composer is intentionally lean in the clean-start foundation. It does not render Astra routes or import Astra app internals.

Composer will compose private, user-scoped feed projections through explicit contracts. Astra will consume those projections without importing Composer internals.

Astra is not a newspaper. Public/shared cards are source or fallback material; the core stream is a private personal feed assembled from public source material, personal state, timing, progress, and explicit permissions.

The first operator workflow lives in `src/operatorWorkflow.ts`:

1. Validate a source-card draft and Composer voice card.
2. Preview the card without writing a user feed item.
3. Require an explicit target user.
4. Emit `ComposerPrivateFeedWrite` for the trusted Astra API.
