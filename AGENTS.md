# Astra Agent Instructions

## Akashic Knowledge Source

- Treat `/Users/tony/Documents/Projects/Akashic` as the shared engineering knowledge source before broad implementation or debugging.
- First read `/Users/tony/Documents/Projects/Akashic/akashic/repomaps/current.md`.
- Then consult relevant Akashic artifacts under `akashic/skills`, `akashic/playbooks`, `akashic/warnings`, `akashic/decisions`, and `akashic/frameworks`.
- For code navigation, use this order: local `akashic/repomaps/current.md` for orientation, local `akashic/repomaps/meta.json` or `REPOMAP.json` for ranked files, then JCodeMunch MCP for symbol-level retrieval when available.
- Do not open large source files blindly. Use REPOMAP first to choose likely files, then use JCodeMunch tools such as `resolve_repo`, `get_repo_outline`, `search_symbols`, `get_file_outline`, `get_symbol_source`, `get_ranked_context`, or `get_blast_radius` before full-file reads.
- If JCodeMunch is unavailable or unindexed, say that briefly, use REPOMAP plus targeted search instead, and do not block the task solely on JCodeMunch.
- Before broad architectural, refactor, migration, or generation work, review local `akashic/agent-inbox/`, `akashic/warnings/`, `akashic/decisions/`, and `akashic/repomaps/current.md`.
- Use `docs/inbox-<repo-or-agent>/` only as a human-visible pointer; the canonical message store is `akashic/agent-inbox/`.
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

## Operating Standard

- Treat this repository as the clean-start Astra project.
- Treat `/Users/tony/Documents/Projects/Astria` as the quarry, not a migration source.
- Use `codex/astra-v2-better-auth-drizzle-neon` as the best auth/data architecture reference unless current evidence supersedes it.
- Start new implementation threads from a fresh branch and use git deliberately.
- Use Mobbin for design-pattern research when available.

## Architecture Law

- Astra renders.
- Composer composes.
- Modules compute.
- Contracts define.
- The database persists quietly.
- UI handles speak through i18n.

No Supabase carryover is allowed: no packages, env vars, imports, RLS policies, role assumptions, compatibility shims, or runtime DDL.

All app UI handles, navigation labels, route headings, aria labels, button text, tab names, and empty/error/loading labels must flow through the app i18n dictionary. Seed/content records may carry their own authored content, but interface chrome should not be hardcoded in route components.

## QA

For UI, route, auth, navigation, public/private data, reports, credits, or user-journey work, use `astra-browser-qa`.

Completion requires:

- lint
- typecheck
- affected tests
- production build
- Playwright route smoke checks for changed routes
- desktop/tablet/mobile rendered verification when layout or navigation changes
- console/page-error review

## Follow-Up Report Shape

Keep closeout concise:

1. What changed.
2. Items to present: commands, routes, journeys, public/private boundary checks, and issues fixed.
3. Recommended next review step: exact route to refresh or action to click.
