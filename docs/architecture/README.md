# Architecture Notes

Core orientation:

- `composer-private-personal-feeds.md` is the governing feed architecture correction. `/journey` is private and user-scoped by default; public/shared stream content is fallback or source material only.
- `clean-start-foundation.md` records the current app foundation and flags transitional stream contracts that must evolve into user-owned feed projections.
- `stream-read-model-cache-boundary.md` defines private feed cache/read boundaries and the required split between public source material and user-owned feed rows.

Use this phrase in architecture reviews:

> Astra is not a newspaper. Composer privately assembles each user's next meaningful card from public source material, personal state, timing, progress, and explicit permissions.
