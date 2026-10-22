# Report simplification: next alpha round

Prepared October 22, 2026. Working branch: `codex/report-simplification-alpha`. Working checkout: `/Users/tony/Documents/Projects/Astra-portraits-v4`.

## The evaluation Tony asked to recover

There are two connected decisions, both preserved in this branch:

1. [Portraits V4 engineering review](../evaluations/ASTRA_PORTRAITS_V4_ENGINEERING_REVIEW.md): replace new Identity/Core/Deep purchases with **Personal**, alongside **Relationship** and **Life Chapter**. Keep historical reports readable. This is the substantial product simplification.
2. [Improve the reading, reduce the machinery](../evaluations/REPORT_QUALITY_COST_REVIEW_2026_09_19.md): check a draft before editing; preserve acceptable prose verbatim; pay for exact repairs only when the check finds a material defect. The compulsory editor's small wording changes did not demonstrate sufficient reader benefit.

The subsequent [simplification tests](../evaluations/REPORT_SIMPLIFICATION_TESTS_2026_09_19.md), [shared conditional editing implementation](../evaluations/PORTRAITS_CONDITIONAL_EDITOR_V4_11.md), and [current writing flow](REPORT_WRITING_FLOW.md) record the follow-through. The recovered work is already implemented locally; do not rebuild it from the older live release.

## Recommended baseline

Use the completed V4.12 / Relationship V3.6 work as the starting point:

- Three report choices: Personal, Relationship, Life Chapter.
- Personal and Life Chapter share the same settings and check-first flow.
- One capable writer. Keep meaningful source/meaning review. Accepted prose returns unchanged.
- Exact-span repair only for specific material findings; no compulsory polishing pass.
- Relationship has no separate prose editor.
- No paragraph-start quota and no arbitrary private-plan character limit.
- No new tools, providers, paid calls, stylistic quotas, or blanket reasoning reduction in this Git-consolidation round.
- Existing saved reports, chart settings, evidence privacy, bounded failures, retries, and usage accounting remain intact.

## Alpha target and production boundary

Intended review hostname: **alpha.astraportrait.com**.

Verified current infrastructure: `astraportrait.com` is served by Vercel project `astra-alpha`; its Git production branch is literally named `alpha`. The alpha hostname currently returns a 307 redirect to the apex. **Pushing the Git branch `alpha` would therefore target the live release, not an isolated test environment.**

This round merges the completed report work into the new non-production branch and pushes that branch. It does not push local `alpha`, promote a deployment, move domains, remove the redirect, or run a paid report. A Git-triggered preview build may be created by Vercel; it is not proof that the intended staging hostname or its private integrations are ready.

Before the next alpha deployment, create or verify a branch-bound preview/custom environment for this new branch, with its own canonical auth URL, correct Composer callback/base URLs, and deliberately chosen data bindings. Verify the preview before replacing the alpha redirect with the branch's domain assignment. Preserve the apex deployment and its data throughout. Do not copy production secrets into documentation or silently assume production bindings are appropriate for a writable test environment.

## What was consolidated

- Live-source baseline: `33400671b1adf0106e0f18ba9ba08877a7b9aacf`.
- Completed report implementation: `21ececc` and its preceding V4 commits.
- Preserved the inherited completed Synastry evaluation as `8f8c177`.
- Recorded Tony's retirement of mandatory AK enforcement; no new gates, receipts, forced lessons, or map rebuilds.
- Merge point: `18b1da5`, bringing the completed report branch into the isolated alpha work branch.
- The old main-checkout UI changes are preserved in `94eeeea` on `codex/astra-brand-primary-buttons`. They are not applied to this branch because they would replace newer tested Journey/onboarding/button behavior with older variants. Preservation does not mean those variants are newly approved for release.
- Private historical phone screenshots and their ZIP were moved intact into ignored `/Users/tony/Documents/Projects/Astra/.astra-exports/git-checkpoint-2026-10-22/`; a SHA-256 preservation manifest is stored there. Private report inputs, readings, ledgers, and the progression verification remain local and ignored.
- Retirement-only changes in the other existing worktrees were committed without merging their unrelated feature work. Local `alpha` remains ahead with governance-only history and is deliberately not pushed to the production trigger.

## Validation of this baseline

Luna ran the existing offline/mocked report checks, typecheck, production build, and focused lint. Portraits V4, report-basis contracts, Synastry engine, typecheck, build, and focused lint passed. The model-strategy test exposed a stale assertion expecting `reasoning: { effort: "none" }`; the adapter intentionally sends `reasoning: { enabled: false }`. Only that test expectation was corrected, and the model-strategy suite then passed. No runtime behavior changed to satisfy the test.

No new authenticated browser/hosted-generation qualification is claimed for this merge. Existing historical browser receipts remain evidence of their recorded revisions. The next alpha deployment still needs its own rendered journey and host-runtime checks. Private command logs are under `.astra-exports/git-consolidation-2026-10-22/`.

## First bounded next step

Bring this existing simplified path to an isolated alpha preview and verify three-choice ordering, old-report reading, unchanged accepted prose, source-boundary rejection/repair, retry behavior, and displayed usage. Use mocked/offline checks first; obtain a new bounded authorization before any paid report run. The current reported progression signs and Whole Sign houses were independently verified; do not change the angle method as incidental report cleanup.

After baseline acceptance, the next evidence-backed simplification candidate is the Relationship review response: replace the contradictory supported/unsupported inventories plus discretionary severity with a short list of exact, material findings and derive acceptance from that list in code. This is the September evaluation's unqualified hypothesis, not a shipped solution. Distinguish permitted romantic possibility language from claims about someone's actual feelings. Do not add another reviewer or tune against only the familiar examples.

**Next goal:** Prepare the existing three-report, check-first flow for isolated review at alpha.astraportrait.com, preserving astraportrait.com and its data, with no paid generation until a bounded run is authorized.
