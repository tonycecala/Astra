---
title: "Astra Alpha Relaunch Route-by-Route Parity Pass"
type: "codex-inbox-directive"
project: "Astra Clean Start"
status: "completed"
priority: "P0"
created: "2026-06-24"
completed: "2026-06-24"
archived: "2026-07-15"
completion_commit: "07054d9"
mission: "Recover/merge outstanding parity work safely, then restore alpha-critical routes one at a time without overwriting recent improvements."
---

# Astra Alpha Relaunch Route-by-Route Parity Pass

## Mission

Take the final steps toward Astra relaunch and alpha deliberately.

Do **not** continue broad parallel restoration. Work one route/surface to completion, verify it, commit it, then move to the next.

Priority order:

1. `/self`
2. `/library`
3. `/allies`
4. `/journey`
5. `/gifts`
6. `/admin`
7. `/settings`
8. Remaining misc screens/routes

The goal is not new architecture. The goal is **visible alpha parity without losing recently improved code**.

---

## First: Git Safety And Branch Recovery

Before editing code, audit the repo state.

### Required branch audit

Run and report:

- current branch
- `git status --short`
- local branches sorted by recent commit
- unmerged branches relative to the current base/main branch
- recent commits on the current branch
- recent commits on any likely Astra parity branches, including:
  - `codex/astra-report-quality-tuning`
  - any branch containing `astra`
  - any branch containing `parity`
  - any branch containing `report`
  - any branch containing `admin`
  - any branch containing `library`
  - any branch containing `self`

Do not assume the active branch contains all relevant work.

### Required protection rule

Before applying edits, create a safety branch from the current working state:

```text
codex/safety-alpha-parity-YYYYMMDD-HHMM
```

If there are uncommitted changes, either commit them with a clear WIP safety message or stash them with a named stash before switching branches.

### Required merge/cherry-pick rule

If outstanding parity work exists on sibling branches, do **not** blindly merge it over current files.

Instead:

1. Inspect the branch diff.
2. Identify files that overlap with recently edited/improved code.
3. Prefer selective cherry-pick or manual patch extraction over broad merge when overlap risk exists.
4. Preserve newer working code unless the older branch contains required parity behavior.
5. For conflicts, resolve by preserving both:
   - recent improvements
   - missing v1 parity behavior

Do not let old work overwrite newer improved code.

### Required closeout for recovery

Report:

- branches inspected
- branches merged, cherry-picked, or intentionally left alone
- files with conflict/overwrite risk
- how each risk was resolved
- commits created

---

## Source Of Truth Documents

Use these repo docs as operating constraints:

- `ASTRA_ALPHA_V1_PARITY_MATRIX.md`
- `ASTRA_PRODUCTION_VISIBLE_PARITY_MATRIX.md`
- `ASTRA_JOB_1_CHART_REPORT_LIBRARY_PARITY.md`
- `ASTRA_JOB_1_REPORT_GEN_V1_COMPARISON.md`
- `ASTRA_CODEX_V1_QUARRY_GUARDRAILS.md`

The rule remains:

> V1 is canon. Supabase Auth is the contaminant. Quarry v1 behavior, remove Supabase coupling, preserve the product.

---

## Anti-Overwrite Rule

The parity matrix is a checklist, not a permission slip to replace working code.

Before modifying any file, answer internally:

1. Was this file recently edited in current branch history?
2. Does another branch contain older changes to the same file?
3. Is the proposed edit restoring missing parity or merely replacing implementation style?
4. Can the parity behavior be added surgically instead of replacing the file?

If a file has recent improvements, patch it minimally.

Forbidden:

- wholesale replacing improved components with older versions
- reverting UI polish without explicit reason
- reintroducing old Supabase assumptions
- removing i18n work
- removing Better Auth/Drizzle/Neon clean-start boundaries
- “simplifying” by deleting working route behavior

---

## Route Completion Method

For each route/surface, use this loop:

1. **Inventory**
   - Compare current v2 route against v1 behavior and the parity docs.
   - List missing, partial, broken, and already-good items.

2. **Quarry**
   - Search v1 before writing new implementation.
   - Produce a short V1 Quarry Note:
     - searched v1 for
     - source files found
     - reused
     - adapted because
     - new code justified because

3. **Patch**
   - Add only what is needed for parity.
   - Preserve recent improved code.
   - Keep implementation modular, typed, and boring.

4. **Validate**
   - Run relevant typecheck/lint/tests/build.
   - Run route smoke or browser QA where available.
   - Verify signed-out, signed-in empty, success, and failure states.

5. **Commit**
   - Commit that route/surface only.
   - Commit message format:
     - `restore <route/surface> alpha parity`
   - Include files changed and tests run in the commit body.

6. **Proceed**
   - Move to the next route only after the current route has a clean closeout.

---

# Route Plan

## 1. `/self`

Goal: make Self the primary private profile/chart/report entry point.

Acceptance:

- signed-out users are gated cleanly
- signed-in user sees profile summary
- Self birth data flow is reachable
- Self chart/report request status is visible
- Self chart detail is reachable
- recent reports/artifacts are visible or linked
- Stars balance is visible if already implemented
- no Composer/public-feed assumptions
- no Supabase assumptions
- mobile layout is sane

Do not add SaaS-style education steps. The existing parity matrix says the durable flow should stay simple: name → birth details → report → review.

## 2. `/library`

Goal: restore Library as the artifact home for generated reports.

Acceptance:

- lists real generated reports/artifacts, not demo-only entries
- list remains lightweight
- filters/search restored if v1 already had them
- detail route renders v1-quality report view
- report actions are visible where already implemented:
  - share
  - revoke/copy link
  - download markdown
  - copy markdown
  - print
  - delete
  - feedback
- refresh does not lose report access
- ownership/privacy boundaries hold

## 3. `/allies`

Goal: restore Ally creation and Ally chart/report loop.

Acceptance:

- signed-in user can create an Ally
- Ally birth data uses the same normalization path as Self
- Ally chart saves privately under current user
- Ally report generates and saves to Library
- Self and Ally reports do not overwrite each other
- Ally reports display subject identity correctly
- Library can distinguish Self vs Ally artifacts

## 4. `/journey`

Goal: verify Journey as the private personalized feed surface, not merely a public stream.

Acceptance:

- signed-out fallback works
- signed-in private empty state works
- Composer-published/private cards reach intended Journey surface if implemented
- card detail opens
- lane filters work
- save/reflect actions work or degrade clearly
- no assumption that Composer only broadcasts public cards
- no leakage of Composer internals into user-facing Astra

## 5. `/gifts`

Goal: restore visible Gifts/Stars flow enough for alpha.

Acceptance:

- Gifts route exists and communicates Stars/transaction framing
- `/stars` or equivalent route parity is restored if alpha-required
- checkout path visible if Stripe parity is already implemented
- ledger-backed balance agrees with profile balance
- spend records and idempotency remain intact
- missing live Stripe config fails gracefully in dev

## 6. `/admin`

Goal: restore admin QA and operator visibility for alpha.

Acceptance:

- admin route exists
- admin user search works
- report request selector exists
- selected-run inspector exists
- replay route/control works
- model profile/provider/model controls exist if already implemented
- recent reports and Library links are visible
- validation errors/provenance are visible
- Stars ledger/admin adjustment controls exist if already implemented
- feedback inbox exists if already implemented
- access is admin-gated

## 7. `/settings`

Goal: restore only alpha-required account/settings behavior.

Acceptance:

- account/session settings are reachable if needed
- profile settings do not duplicate Self incorrectly
- no broad notification center unless alpha-required
- no dead legacy Supabase account routes

## 8. Misc Screens

Goal: repair only what alpha needs.

Acceptance:

- no broken nav links
- no dead routes from removed Supabase era
- no old production route aliases unless alpha-critical
- 404/empty/loading states are intentional

---

## Global Technical Rules

- No Supabase dependency.
- Better Auth remains the auth boundary.
- Drizzle/Neon remains the database boundary.
- i18n routing must not be bypassed.
- User data remains private.
- Composer internals stay out of `astra-web`.
- Shared packages remain contracts/primitives only.
- No circular app/package dependencies.
- No broad refactors while parity gaps remain.
- No new design language unless v1 cannot be reused.

Allowed dependency direction:

```text
apps/astra-web -> packages/*
apps/composer-web -> packages/*
packages/* -> no app imports
```

Forbidden:

```text
apps/astra-web -> apps/composer-web
apps/composer-web -> apps/astra-web
packages/* -> apps/*
```

---

## Required Tests / Validation

Use existing repo tooling. Do not invent a new framework.

At minimum, run the most relevant available commands for each route pass:

- typecheck
- lint
- unit tests touching changed packages
- route smoke tests
- E2E happy path where available
- production/preview build if the repo supports it locally

For chart/report/library surfaces, preserve or add tests proving:

- birth data normalization works
- Self and Ally ownership remain distinct
- report generation can run from chart payloads
- report persistence creates Library artifacts
- Library list/detail can reopen persisted reports
- another user cannot see private reports
- Supabase auth/session assumptions do not reappear

---

## Required Closeout Format

At the end of this pass, report:

1. Git branch safety audit results.
2. Branches inspected.
3. Branches merged/cherry-picked/manual-patched.
4. Route completed.
5. Files changed.
6. V1 quarry notes.
7. Tests/commands run.
8. Screenshots or browser QA notes if available.
9. Remaining route gaps.
10. Confirmation that no recent improved code was overwritten by older parity work.
11. Confirmation that Supabase is not required.
12. Next recommended route.

---

## Final Instruction

Proceed carefully, route by route.

Do not declare “merged” or “done” until sibling branches have been audited.

Do not overwrite recent improvements with older parity code.

Restore the product loop, preserve the cleaner body, prove each route, and commit each completed surface separately.
