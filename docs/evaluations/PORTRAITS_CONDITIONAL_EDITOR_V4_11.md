# One editorial standard for Personal and Life Chapter

September 19, 2026. Tony requested one new Personal report and the same editing settings for Life Chapter. Local implementation; no deployment. The paid observation used V4.11; the subsequently authorized private-plan fix is V4.12.

## Decision

Both report families now use writer → source/meaning review → return unchanged if accepted. Only concrete findings with a clear reader benefit open the exact-span repair path, followed by independent review. V4.11 removes the separate Life Chapter compulsory-polishing branch rather than duplicating Personal logic. Models, reasoning settings, source evidence, private trace, word limits, retry bounds and cumulative revision allowance are unchanged.

Life Chapter keeps its selected date and natal/progressed participant identities. Those are necessary source distinctions; they do not create a different editing policy. Neither report pays an editor merely to shuffle words. Accepted drafts use two paid calls; a single successful repair uses four; the longest successful bounded path uses seven.

The [linked flowchart](../architecture/REPORT_WRITING_FLOW.md) reflects both report families. V4.10's Personal-only decision remains preserved as history.

## Paid Personal observation

One fresh invocation was authorized, using the exact latest saved Personal input through the production generation entry. Existing bounded retries only; no discretionary reruns. Incremental hard cap $1 within the cumulative $30 ledger. The established Bedrock-only route, ZDR, data collection denial, no fallback, reservation and receipt controls remain.

Private decision, frozen source/input hashes, requests, responses and prose live under `.astra-exports/portraits-v4/personal-check-first-2026-09-19/`. Saved baselines are untouched. The run completed in 87.8 seconds for **$0.135478**, with **zero editor calls and zero editorial replacements**. An initial writer attempt cost $0.047391 and was rejected because its private `thread` contained 1,688 characters against a 1,500-character limit. The second writer attempt cost $0.037947; the source/meaning review accepted it for $0.050140. The private schema retry regenerated prose; it was not an editorial intervention. Cumulative settled spend is **$8.571698 of $30**, with no outstanding reservations.

Parent judgment: the accepted report is coherent and has no material defect identified in this reading that warrants a paid edit. Technical references checked against the selected packet are supported; residual wording preferences are not sufficient grounds for polishing. The check accepted without repairs, so this observation shows successful editor bypass, not proof that the reviewer detects every source error.

The paid run exposed a full writer retry caused only by private planning length. Tony then explicitly authorized fixing that limit; the local V4.12 adjustment below implements it. No extra paid test was run. This is an observation, not a controlled estimate of savings: a fresh writer sample can change prose independently of editing.

## V4.12 follow-up: private planning length no longer rejects prose

The private `thread` schema now requires a string without an arbitrary character minimum or maximum. It previously required 20–1,500 characters, so a 1,688-character plan discarded an otherwise structurally usable draft. Both Personal and Life Chapter inherit the fix from the same schema. The plan and prose are preserved verbatim; there is no truncation, summarizer, extra model, or new repair stage. The existing 7,000-token writer output limit and overall spend controls still bound acquisition.

Malformed JSON, missing/wrong-type fields, invalid section structure, missing/unknown source references, visible prose limits and privacy checks remain. The independent source/meaning reviewer still must approve the report; removing the metadata quota cannot bypass it.

The saved V4.11 requests, outputs and frozen hashes remain historical evidence. A separate offline replay of the first rejected response tests V4.12 with a mocked review: that can prove the length bottleneck no longer triggers a second writer call, but cannot establish how the live reviewer would have judged that first draft. Replay passed: the exact saved 1,688-character plan reaches review in two simulated calls with unchanged plan and visible prose, no editor, and zero new paid calls. The receipt is `.astra-exports/portraits-v4/private-plan-limit-2026-09-19/replay-validation.json`, with original response and current source hashes. Replayed historical usage is not a new ledger charge.

## Verification and review

Luna's `npm run test:portraits-v4` engine/budget/inspector suites, focused ESLint, `npm run typecheck` and production build passed after the final V4.12 patch. Tests cover 1,688-character, short and empty private plans for both families with unchanged prose and required review; wrong-type plans and missing source references still fail. Both families assert two-call accepted paths without editor provenance; Life Chapter has a four-call targeted repair and a no-findings guard, plus malformed-edit retry coverage. Personal failure and exact-span checks remain. Parent reviewed the actual source/test/documentation diff and the live Personal request, draft, review and output.

**Steward judgment: accept-with-notes.** The production change removes the special compulsory Life Chapter editor branch and reuses Personal's existing flow. Parent also reviewed the V4.12 schema diff and exact saved-response replay; removal of the private character quota neither truncates content nor relaxes required source fields. Source checks, model/reasoning settings, date and natal/progressed distinctions, budgets, privacy and edit limits remain. The live report verifies Personal dispatch, not live Life Chapter literary quality. No Life Chapter report was purchased.

No authenticated browser fixture was run because it writes report/auth/credit state to the database; this task used private local output only. No routes, layouts, account flows or prices changed. Global lint was not rerun; existing ignored experiment-runner errors remain outside focused lint. Governance check still reports existing missing prompt-aware advisory retrieval and doctor reports pre-existing artifact metadata issues; no actionable mail blocked work. These unrelated issues were not changed.

The inherited Synastry V3.3 evaluation edit remains untouched. The verification playbook now documents one shared editing policy. No new reusable lesson beyond this updated local procedure; the private-plan length quota is now removed in V4.12, with the live-result versus offline-replay distinction preserved. No deployment or database writes.
