# inbox-astra

Human-visible task briefs and handoffs for Astra.

Canonical machine-readable agent mail:

- `akashic/mail/new/`
- `akashic/mail/working/`

Use `ak mail` to claim, close, release, or reopen actionable agent mail. Legacy `akashic/agent-inbox/` files are historical knowledge, not the active mailbox.

## Human Inbox Lifecycle

- Keep only live briefs, active requests, and unresolved handoffs in `docs/inbox-astra/`.
- When a brief's work is completed, the completing agent must update its frontmatter to `status: "completed"` or `status: "superseded"`, add `completed` or `updated` metadata and completion evidence when available, then move it to `docs/inbox-astra/completed/` before closeout.
- Move related prompts and implementation plans together so the completed record remains understandable.
- Preserve completed history; do not delete it.

Completed or already-acted human handoffs belong under:

- `docs/inbox-astra/completed/`

## Current Human-Readable Parity Docs

- `ASTRA_ALPHA_ROUTE_PARITY_PROGRESS.md` records the route-by-route alpha status and the 2026-06-24 progress pass.
- `ASTRA_ALPHA_V1_PARITY_MATRIX.md` is the living v1 quarry matrix for alpha-critical chart, report, Library, Stars, admin, feedback, Allies, and mobile-shell parity.
