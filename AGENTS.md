# Astra Agent Instructions

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
