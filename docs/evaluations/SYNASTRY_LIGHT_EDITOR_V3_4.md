# Synastry light editor — V3.4

## Prospective change and run

Tony authorized a simpler editor and one new Synastry run. The prior comparison showed changes in all 19 paragraphs, many cosmetic and some adding unsupported certainty. Hypothesis: replacing the broad writing brief with minimal repair instructions will preserve more good prose without requiring a new review layer.

Only the Synastry editor brief changes; writer instructions, model, output format, trace, semantic review and retry limits remain intact. Preserve good prose verbatim, repair only clumsy/confusing passages with clear reader benefit, and add no interpretations, consequences, advice, warnings or caveats. Version metadata identifies the new policy. No hard edit-count threshold.

Run `synastry-light` once through the existing production-function harness, using the saved Tony–Cheyenne source pair and frozen settings. This is a fresh writer/editor/reviewer run, not a controlled same-draft comparison to the previous editor. Compare this run's actual editor input to its final output. Keep original and new artifacts private; no deployment or application database writes.

Verified starting ledger $5.209835 with no unsettled reservations. Additional maximum $1.50; absolute stage cap $6.709835, also bounded by the original $30 maximum. Actual spend and every attempt must remain recorded. No automatic further experiment.

UI patterns/analytics: N/A, no UI or event-contract changes. Report-reader regression uses existing focused QA; actual new prose is judged from untouched saved output.

## Bounded recovery

The first run cost $0.353046 ($0.100401 writer, $0.252645 editor). Editor prose was byte-identical to its input, but the required trace hit the existing 8,000 output-token ceiling. The result correctly failed; no final report or semantic acceptance is claimed. Smallest mechanical repair: increase only the editor output allowance to 12,000 tokens, leaving prompt, model and failure handling unchanged. One recovery run is authorized within the same absolute $6.709835 stage cap; retain the failed run and its costs. This increases maximum output allowance, not a target length.

## Completed result and Steward review

Recovery cohort: `.astra-exports/portraits-v4/synastry-light-2026-09-19T17-50-09.427Z/`; final `R-cb4e4af4`. Raw editor prose equals writer draft byte-for-byte. Final FK grade 9.8, same as draft. Three final text substitutions are existing deterministic normalization, not API edits. Private REVIEW.md links the untouched final, draft, raw editor and exhaustive pipeline diff.

Successful run $0.343083, including editor $0.237360. Total with failed run $0.696129; ledger $5.905964, all settled. Both cases stayed private, with no application DB mutation or deployment.

Validation: engine smoke, typecheck, lint and production build passed after output-ceiling repair. Lint retains the pre-existing `_staleNote` warning. Focused desktop `synastry-v3-production.spec.ts` passed against isolated local QA with paid keys disabled, covering canonical Ally editing, private evidence, public-share suppression and console/page-error review. This ran before the allowance-only repair; the subsequent engine suite verifies that repair. Unchanged layout/navigation did not justify additional viewport sweeps. Artifact inspector: no findings/advisories. Prior private artifacts and the pre-existing V3.3 evaluation edit remain byte-identical, except the expected spending ledger update.

**Steward: accept-with-notes.** Actual runtime diff only narrows the Synastry editor brief and increases the proven insufficient output allowance; the harness scopes and caps the experiment, and fixtures assert that allowance. Writer and semantic rules, Personal/Life Chapter, routing and fail-closed behavior remain unchanged. Restraint is demonstrated; cost effectiveness is not. No additional paid run warranted. Updated existing verification playbook with stage attribution and restraint procedure.
