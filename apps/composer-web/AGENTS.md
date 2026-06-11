# AGENTS.md

## Akashic Knowledge Source

- Treat `/Users/tony/Documents/Projects/Akashic` as the shared engineering knowledge source before broad implementation or debugging.
- First read `/Users/tony/Documents/Projects/Akashic/akashic/repomaps/current.md`.
- Then consult relevant Akashic artifacts under `akashic/skills`, `akashic/playbooks`, `akashic/warnings`, `akashic/decisions`, and `akashic/frameworks`.
- Before broad architectural, refactor, migration, or generation work, review local `akashic/agent-inbox/`, `akashic/warnings/`, `akashic/decisions/`, and `akashic/repomaps/current.md`.
- Active inbox items must be acknowledged, acted on, explicitly deferred, superseded, or closed by updating their frontmatter `status`.
- For Next.js, Vercel, route, compile, or testing work, start with:
  - `/Users/tony/Documents/Projects/Akashic/akashic/frameworks/nextjs/platform-lessons.md`
  - `/Users/tony/Documents/Projects/Akashic/akashic/skills/verify-nextjs-change-locally.md`
  - `/Users/tony/Documents/Projects/Akashic/akashic/skills/playwright-route-smoke-checks.md`
  - `/Users/tony/Documents/Projects/Akashic/akashic/playbooks/nextjs-platform-change-validation.md`
- If Akashic contains a relevant warning, treat it as a hard-earned prior unless current repo evidence proves otherwise.
- For new repo-local learning, run `ak capture ...` or `ak learn ...` in the repo where the lesson was discovered.
- Central Akashic does not learn automatically from local captures. After meaningful local learning, run `ak ingest <repo-path>` from `/Users/tony/Documents/Projects/Akashic` so central Akashic gains the knowledge with provenance.
- Direct-edit central Akashic only when deliberately promoting a lesson into canonical cross-project guidance; then run `ak repomap build && ak validate`.
- When unsure, capture locally first, ingest centrally second, and promote canonically only after the lesson proves reusable.
- Use `ak notify <repo-path> <title> --body <text> [--priority high] [--type warning]` when another repo's agent needs to know something; do not rely on Tony as the message carrier.
- Preserve local repo instructions first when they are stricter or more specific.

## Composer Context

- This clean-start Composer app is intentionally placeholder-only until implementation begins.
- Also obey `/Users/tony/Documents/Projects/Astra/AGENTS.md`; root Astra rules remain binding.
- Composer composes and publishes artifacts through explicit contracts. Astra consumes those artifacts without importing Composer internals.
