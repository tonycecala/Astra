---
title: "Next Thread: Composer Private Feed Operator Workflow"
project: "Astra"
repo: "Astra"
area: "composer-private-feed"
type: "handoff"
status: "acted"
priority: "high"
from: "Codex"
to: "next Astra thread"
risk_level: "medium"
created: "2026-06-16"
source: "Astra private feed workflow handoff"
report_level: "3 - Workflow & QA View"
tags: ["agent-message", "handoff", "composer", "private-feed", "journey"]
related:
  - "../../docs/architecture/composer-private-personal-feeds.md"
  - "../../docs/architecture/stream-read-model-cache-boundary.md"
  - "../../docs/progress/PROGRESS_LOG.md"
---

# Next Thread: Composer Private Feed Operator Workflow

Current state: `main` is clean. Astra now has private Journey reads, `ComposerPrivateFeedWrite`, `POST /api/composer/private-feed-items`, Composer publisher helpers, report-signal publishing through the private-feed service, and smokes proving user ownership/privacy. The old `/api/composer/stream-artifacts` path remains public fallback/source-layer only.

## Suggested Goal

Build the first Composer operator/review workflow on top of the private-feed write edge in 20 concrete steps, ending clean on `main`.

1. Run `ak governance check`, inspect inbox/warnings, and confirm clean `main`.
2. Read the Composer private feed docs and current progress log.
3. Audit `apps/composer-web`, `apps/astra-web/app/api/composer/private-feed-items`, and private feed repository helpers.
4. Decide the minimal operator workflow: source card draft -> preview -> target user -> publish private feed item.
5. Add or update Composer app structure only where needed; keep Composer independent from Astra app internals.
6. Define any missing UI copy through the app i18n dictionary if Astra UI changes are needed.
7. Add a Composer-side source-card/private-feed draft fixture.
8. Add deterministic validation for operator-created source cards and voice cards.
9. Add an operator publish helper that emits `ComposerPrivateFeedWrite`.
10. Add or refine the trusted Astra API smoke to cover operator-created source cards.
11. Add an ownership smoke proving User A publish does not appear for User B or signed-out `/journey`.
12. Add a repeat-publish/idempotency smoke for feed item plus decision trace.
13. If a visible Composer route is added, verify it in browser on desktop and phone.
14. Verify signed-in `/journey` receives the operator-published private card.
15. Verify incognito/signed-out `/journey` does not receive that private card.
16. Sweep adjacent routes touched by navigation or shared layout.
17. Update architecture docs and `docs/progress/PROGRESS_LOG.md`.
18. Run validation: `typecheck`, `lint`, `test`, boundary checks, no-Supabase, focused smokes, build, e2e.
19. Commit the implementation with a concise message.
20. Fast-forward merge to `main`, confirm clean status, and report routes/tests/privacy proof.

## Guardrails

- Do not make `/journey` public-news-like again.
- Do not import Astra app internals into Composer or Composer internals into Astra routes.
- Keep Composer decisions private; do not return them through the user-facing feed.
- Treat `/api/composer/stream-artifacts` as fallback/source-layer only.
- Browser-visible QA is required for any route/UI work.

## Resolution

Completed on `codex/astra-composer-operator-workflow`.

- Added `apps/composer-web/src/operatorWorkflow.ts` for source-card draft validation, preview, explicit target-user review, and `ComposerPrivateFeedWrite` emission.
- Added `scripts/smoke-composer-operator-workflow.mts` and `npm run test:composer-operator-workflow`.
- Updated architecture/progress docs and the foundation invariant check.
- Verified the workflow through the trusted private-feed API, repeated publish/idempotency, User A/User B privacy, signed-out public fallback privacy, and signed-in `/journey` visibility.
- Browser QA found and fixed tablet horizontal overflow on `/journey`.
