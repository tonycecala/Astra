# inbox-astra

Human-visible pointer for this repo's Akashic inbox.

Canonical machine-readable inbox:

- `akashic/agent-inbox/`

Agent-specific workspace:

- `akashic/agent-inbox/astra/`

Agents should read the canonical inbox before broad architectural, refactor, migration, or generation work. Active messages are resolved by updating their frontmatter `status` to `acknowledged`, `acted`, `deferred`, `superseded`, or `closed`.

Completed or already-acted handoffs that no longer require agent attention should be filed under:

- `docs/inbox-astra/completed/`

Keep only live handoffs, active requests, and not-yet-resolved warnings in the canonical inbox.

## Current Human-Readable Parity Docs

- `ASTRA_ALPHA_ROUTE_PARITY_PROGRESS.md` records the route-by-route alpha status and the 2026-06-24 progress pass.
- `ASTRA_ALPHA_V1_PARITY_MATRIX.md` is the living v1 quarry matrix for alpha-critical chart, report, Library, Stars, admin, feedback, Allies, and mobile-shell parity.
