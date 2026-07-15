# Composer Agent Instructions

- Obey the root `AGENTS.md`; its governance, navigation, safety, QA, YAGNI, and reporting rules remain binding.
- Use root Akashic Mail guidance. This child file defines only stricter Composer product boundaries.
- Preserve local rules when they are stricter than the root.

## Composer Context

- Composer composes private, user-scoped feed projections through explicit contracts. Astra consumes those projections without importing Composer internals.
- Astra is not a newspaper. Public/shared cards are source or fallback material; the core stream is a private personal feed assembled from public source material, personal state, timing, progress, and explicit permissions.
- Composer must not import Astra app internals; Astra must not import Composer internals. Shared packages remain contracts and primitives rather than a backchannel between apps.
- Composer UI handles, route headings, navigation labels, button text, form labels, status text, and empty/error/loading copy must flow through Composer's local i18n dictionary before they appear in route components.
