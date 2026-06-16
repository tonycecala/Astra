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
