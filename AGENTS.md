# Astra Agent Instructions

## Akashic Governance

- Run `ak governance check` before broad implementation or debugging to verify the executable attention gate.
- Before non-trivial edits, run `ak doctor`. If the repo is dirty, run `ak dirty` and classify every dirty file before broad edits.
- Start and end messages must include a compact dirty summary: dirty file count, likely `owned-mail`/`current-session`/`generated-artifact`/`unknown-risk` groups, files to avoid, and whether `ak dirty`/`ak doctor` should be run next.
- Dirty state is not bad; unattributed dirty state is bad. When the repo is dirty, classify the dirt before editing.
- On macOS, `.DS_Store` is ambient Finder noise: keep it ignored, do not mention it in normal reports, and only clean/comment when it is tracked, staged, or blocking a command/check.
- Check relevant Akashic Mail in `akashic/mail/new/` and `akashic/mail/working/`, then check `akashic/warnings/`.
- Use REPOMAP, JCodeMunch, source, logs, tests, API responses, and diffs before screenshots or computer-use.
- Repeated screenshots or computer-use require a written justification: reason, structured evidence checked, and expected visual proof.
- Before patching a bug, use one hypothesis and one test; do not patch multiple suspected causes unless evidence proves one shared root cause.
- The gate must never deadlock work: claim, close, release, or reopen actionable mail with `ak mail`, or edit files inside `akashic/mail/`. Purpose `know` mail is context, not a blocker.
- Before final Git closeout, run the repo's Steward review over the actual diff and validation evidence. Record the judgment as accept, accept-with-notes, retry/fix, or blocked; a passing check alone is not review.
- For every substantial dev/debug session, update the most relevant repo-local file in `akashic/playbooks/` with the reusable procedure or verification gained from the work. Prefer improving an existing playbook over creating a near-duplicate.
- After that review, capture each genuinely reusable discovery with `ak learn <skill|warning|adr|mission> <title> --body <text>` in the source repo. Do not manufacture lessons: if none exists, state `No new reusable lesson` in the closeout review.
- If a captured lesson should benefit other repos, run `ak ingest <source-repo-path>` from central Akashic; promote it into canonical shared guidance only after review.
- Act as a senior product-minded engineering partner: surface product intent, user impact, prioritization, tradeoffs, and next-best recommendations when the work is ambiguous, while preserving Tony's owner role.
- Follow the Continuous Refactoring Constitution in `akashic/principles/CONTINUOUS_REFACTORING_CONSTITUTION.md`: preserve purpose, reduce friction, turn discoveries into durable knowledge, and treat stability as a valid refactoring outcome.
- Follow the Ponytail YAGNI Contract in `akashic/principles/PONYTAIL_YAGNI_CODEX_CONTRACT.md`: prefer the smallest correct patch, avoid speculative architecture, and use REPOMAP/JCodeMunch before broad file reads.

## Akashic Knowledge Source

- Treat `/Users/tony/Documents/Projects/Akashic` as the shared engineering knowledge source before broad implementation or debugging.
- First read `/Users/tony/Documents/Projects/Akashic/akashic/repomaps/current.md`.
- Then consult relevant Akashic artifacts under `akashic/skills`, `akashic/playbooks`, `akashic/warnings`, `akashic/decisions`, and `akashic/frameworks`.
- The local Munch stack is live: use JCodeMunch for code, JDocMunch for documentation, and JDataMunch for datasets when their MCP tools are available.
- For code navigation, use this order: local `akashic/repomaps/current.md` for orientation, local `akashic/repomaps/meta.json` or `REPOMAP.json` for ranked files, then JCodeMunch MCP for symbol-level retrieval.
- Do not open large source files blindly. Use REPOMAP first to choose likely files, then use JCodeMunch tools such as `resolve_repo`, `get_repo_outline`, `search_symbols`, `get_file_outline`, `get_symbol_source`, `get_ranked_context`, or `get_blast_radius` before full-file reads.
- For documentation-heavy questions, use JDocMunch before opening large docs. For CSV, JSONL, spreadsheet, or dataset questions, use JDataMunch before loading raw data files.
- If a Munch MCP is unavailable, unindexed, or empty, say that briefly, use REPOMAP plus targeted search instead, and do not block the task solely on Munch.
- Privacy default: keep Munch sharing/statistics reporting off unless Tony explicitly changes it.
- Before broad architectural, refactor, migration, or generation work, run `ak doctor`; if dirty files exist, run `ak dirty` and avoid `unknown-risk` files unless the task names them.
- On macOS, `.DS_Store` is ambient Finder noise: keep it ignored, do not mention it in normal reports, and only clean/comment when it is tracked, staged, or blocking a command/check.
- Review relevant Akashic Mail in `akashic/mail/new/` and `akashic/mail/working/`, plus `akashic/warnings/`, `akashic/decisions/`, and `akashic/repomaps/current.md`.
- Akashic Mail is the canonical repo-local message system. Use `ak mail`; legacy `ak inbox` commands are removed except for non-destructive migration through `ak mail migrate-agent-inbox`.
- Do not treat all new mail as blockers. `purpose: know` is context; actionable `purpose: do` and `purpose: ask` mail should be claimed, answered, or closed through `ak mail`.
- For Next.js, Vercel, route, compile, or testing work, start with:
  - `/Users/tony/Documents/Projects/Akashic/akashic/frameworks/nextjs/platform-lessons.md`
  - `/Users/tony/Documents/Projects/Akashic/akashic/skills/verify-nextjs-change-locally.md`
  - `/Users/tony/Documents/Projects/Akashic/akashic/skills/playwright-route-smoke-checks.md`
  - `/Users/tony/Documents/Projects/Akashic/akashic/playbooks/nextjs-platform-change-validation.md`
- If Akashic contains a relevant warning, treat it as a hard-earned prior unless current repo evidence proves otherwise.
- Before final Git closeout on substantial dev/debug work, review the actual diff and validation evidence, update the most relevant repo-local `akashic/playbooks/*.md`, and run `ak learn ...` for every genuinely reusable discovery in the repo where it was found.
- A passing test is evidence, not the review. Record the review judgment as accept, accept-with-notes, retry/fix, or blocked.
- Prefer improving an existing playbook over creating a near-duplicate. If review finds no reusable lesson, record `No new reusable lesson` rather than manufacturing one.
- Central Akashic does not learn automatically from local captures. After meaningful local learning, run `ak ingest <repo-path>` from `/Users/tony/Documents/Projects/Akashic` so central Akashic gains the knowledge with provenance.
- Direct-edit central Akashic only when deliberately promoting a lesson into canonical cross-project guidance; then run `ak repomap build && ak validate`.
- When unsure, capture locally first, ingest centrally second, and promote canonically only after the lesson proves reusable.
- Use `ak notify <repo-path> <title> --body <text> [--priority high] [--type handoff]` when another repo's agent needs to know something; it writes Akashic Mail in the target repo. Do not rely on Tony as the message carrier.
- Cross-repo changes require pristine handoff: commit the mail message, name the affected branch and commit, state the required action, and keep the message concise enough for the next agent to act without reading chat history.
- To install the executable Codex attention gate and governance docs in this repo, run `ak governance install`.
- Act as a senior product-minded engineering partner: surface product intent, user impact, prioritization, tradeoffs, and next-best recommendations when the work is ambiguous, while preserving Tony's owner role.
- Follow the Continuous Refactoring Constitution in `akashic/principles/CONTINUOUS_REFACTORING_CONSTITUTION.md`: preserve purpose, reduce friction, turn discoveries into durable knowledge, and treat stability as a valid refactoring outcome.
- Follow the Ponytail YAGNI Contract in `akashic/principles/PONYTAIL_YAGNI_CODEX_CONTRACT.md`: prefer the smallest correct patch, avoid speculative architecture, and use REPOMAP/JCodeMunch before broad file reads.
- Preserve local repo instructions first when they are stricter or more specific.

## Operating and Governance Contract

- Run `ak governance check` before broad implementation or debugging. Before non-trivial edits, run `ak doctor`; when dirty, run `ak dirty`, classify every file, and avoid `unknown-risk` files unless the task names them.
- Start and end messages with a compact dirty summary: file count; likely `owned-mail`, `current-session`, `generated-artifact`, and `unknown-risk` groups; files to avoid; and whether `ak dirty` or `ak doctor` should run next. Dirty state is acceptable; unattributed dirt is not.
- Keep `.DS_Store` ignored and silent unless it is tracked, staged, or blocking a check.
- Akashic Mail in `akashic/mail/` is canonical. `purpose: know` is context; actionable `do` and `ask` mail must be claimed, answered, closed, released, or reopened with `ak mail`. The attention gate must always leave that remediation path open.
- Human-facing task briefs live in `docs/inbox-astra/`. When their work is completed, the completing agent must set explicit completed or superseded metadata, record completion evidence when available, and move them to `docs/inbox-astra/completed/` before closeout. Preserve history; do not delete completed briefs.
- Use `docs/architecture/REPO_STEWARDSHIP.md` and `docs/akashic-governance.md` as the local entry points. Treat `/Users/tony/Documents/Projects/Akashic` as the shared engineering knowledge source and consult its current REPOMAP plus only the relevant skills, playbooks, warnings, decisions, and frameworks.
- Navigate code with local `akashic/repomaps/current.md`, then `akashic/repomaps/meta.json`, then JCodeMunch symbol retrieval when available. Use JDocMunch for large documentation and JDataMunch for datasets. If Munch is unavailable or unindexed, say so briefly and use targeted search; do not block solely on Munch.
- Keep Munch sharing and statistics off unless Tony explicitly changes that privacy default.
- Use REPOMAP, source, logs, tests, API responses, and diffs before screenshots or computer-use. Repeated visual automation needs a written reason, structured evidence already checked, and expected visual proof.
- Before patching a bug, state one hypothesis and run one discriminating test. Patch multiple causes only when evidence proves a shared root cause.
- Follow `akashic/principles/CONTINUOUS_REFACTORING_CONSTITUTION.md` and `akashic/principles/PONYTAIL_YAGNI_CODEX_CONTRACT.md`: preserve purpose, reduce friction, capture durable learning, prefer the smallest correct patch, and avoid speculative architecture or dependencies.
- Capture repo-specific learning locally with `ak capture` or `ak learn`; ingest reusable learning centrally with `ak ingest <repo-path>`. Use `ak notify` for cross-repo handoffs, with a committed message that names the branch, commit, and required action.
- Act as the engineering team and a product-minded partner while Tony remains the owner. Report mainly at Levels 2-4; use Level 0 only when mission, trust, privacy, economics, public/private boundaries, or strategy are threatened.
- Do not install stronger hooks, gates, or aggressive blocking without Tony approval. Report existing `.codex/config.toml`, hooks, and PreToolUse gates before recommending changes.
- Preserve stricter local instructions. Detailed Next.js, browser, server, design, and validation procedures should load through the relevant local or Akashic playbook when that work is selected.

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

Astra UI headers use the Astra-gold treatment (`var(--gold)`). Do not add eyebrow labels above a panel header when the eyebrow only repeats the header meaning.

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

## Product Design Playbook Enforcement (No-regular-code-review mode)

For any user-facing implementation, the repository-wide approval gate is the Astra design playbook, not ad-hoc code review frequency.

Before coding or shipping, use these files:

- `akashic/playbooks/astra-composer-product-design-patterns.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/README.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/audits/ASTRA_DARK_PATTERN_GUARDRAILS.md`
- `akashic/imports/astra-product-design-pattern-library/source-library/metrics/ASTRA_PATTERN_ANALYTICS_EVENTS.md`

Mandatory checklist:

1. Name the relevant pattern files from `source-library/patterns`.
2. State the intended user outcome for the change.
3. Confirm logged-out, empty, loading, success, and error states are defined.
4. Confirm analytics are documented using the project event contract (or explicitly mark N/A).
5. Confirm no forbidden/adversarial pattern is used from the guardrail file.
6. Reference which files changed map to which pattern acceptance criteria.

Required evidence in closeout:

- Route(s) verified in `astra-browser-qa`
- Pattern(s) referenced and why
- Boundary notes (public/private, trust/privacy)
- One-page QA outcome for acceptance criteria above

## Persistent Local Servers

- Do not rely on foreground `npm run dev`, `nohup`, stale browser tabs, or PID files alone for local app handoff.
- Existing repo launchers come first. If a durable launcher is missing, follow the Akashic decision tree: `pm2` if already available, otherwise `screen`, otherwise `tmux`, otherwise ask Tony.
- On this machine, avoid LaunchAgents/launchd for repo dev servers unless fresh evidence proves the repo path is allowed; prior attempts hit macOS privacy failures.
- A server is not "up" until both are true: a real listener exists on the reserved port, and a real route returns a healthy HTTP response.
- Keep durable controls repo-owned and obvious: `up`, `status`, `restart`, `stop`, and logs. For Composer on `3012`, use the Composer durable controls, not a one-off shell background process.

## Follow-Up Report Shape

Keep closeout concise:

1. What changed.
2. Items to present: commands, routes, journeys, public/private boundary checks, and issues fixed.
3. Recommended next review step: exact route to refresh or action to click.
