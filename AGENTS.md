# Astra Agent Instructions

## Akashic Governance

Tony retired mandatory AK rituals on 2026-10-22. This owner decision supersedes older AK requirements elsewhere in this repository or historical guidance.

- Do not require AK preflight, doctor/dirty/onboard sequences, Mail sweeps, closeout receipts, Steward ceremonies, forced lessons, ingest, reports, or REPOMAP rebuilds to do or finish work.
- No AK hook may block tools, create receipts, or require an owner override. Existing receipts, Mail, knowledge, and audit history remain intact; pending history is not a work blocker.
- Keep meaningful project tests, evidence review, privacy safeguards, explicit authorization boundaries, and protection of other agents' work. These are ordinary engineering responsibilities.
- Use knowledge, search, validation, and useful handoffs when they help the actual task. Update a useful document directly when there is something worth preserving. Do not manufacture lessons or paperwork.
- Honor Tony's explicit direction. Do not reinstall retired enforcement or interrupt running agents to refresh instructions.

## Akashic Stewardship v3 & Reporting Levels

- This repo is governed by `/Users/tony/Documents/Projects/Akashic/akashic/governance/AKASHIC_REPO_STEWARDSHIP_PROTOCOL.md`; start substantial work from `docs/architecture/REPO_STEWARDSHIP.md`.
- Codex acts as the engineering team and should report mostly at Levels 2-4: Level 2 for architecture/boundaries, Level 3 for workflow/QA, and Level 4 for implementation/debug detail.
- Level 0 is a governing constraint and escalation level only. Use it only when technical work threatens mission, user promise, trust, privacy, economics, public/private boundaries, or strategic direction.
- Do not install stronger hooks, gates, or aggressive blocking without Tony approval. Report existing `.codex/config.toml`, hooks, and PreToolUse gates before recommending changes.

## Ponytail YAGNI Contract

- Follow `/Users/tony/Documents/Projects/Akashic/akashic/principles/PONYTAIL_YAGNI_CODEX_CONTRACT.md`.
- Prefer the smallest correct patch. Do not add speculative architecture, migration frameworks, plugin systems, provider abstractions, generic engines, broad config layers, or new dependencies unless the current task clearly requires them.
- Treat JCodeMunch/JCM and REPOMAP as the default navigation path before broad file reads whenever available.
## Akashic Knowledge Source

- Shared knowledge lives in `/Users/tony/Documents/Projects/Akashic`; use relevant playbooks, warnings, decisions, skills, and frameworks when useful.
- Search with available JCodeMunch/JDocMunch/JDataMunch, `rg`, or `ak search`. REPOMAP is an optional navigation aid. Unavailable indexes never block work; keep Munch sharing/statistics off.
- Use `ak validate` when checking knowledge edits or preparing knowledge for sharing, not as a prerequisite to unrelated work.
- Use `ak notify <repo-path>` and basic `ak mail` commands for an actual cross-repository handoff. Include the action, evidence, and relevant paths; do not make Tony relay context. Mail is not an execution gate.
- Direct Markdown edits are welcome. Capture, ingest, reports, and other legacy commands remain manual conveniences, not required workflow.
- The owner retired mandatory AK rituals on 2026-10-22; this supersedes older AK workflow requirements while preserving project-specific safety and correctness rules.

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
