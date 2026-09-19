# Synastry V3.5 — remove the paid prose editor

## Owner decision and result

Tony requested removal after the paid light-touch editor returned unchanged prose. New Synastry generation now runs writer → existing semantic review. The dedicated editor prompt, model/version constants, provider dispatch, output allowance, failure branch and new editor metadata are removed. No replacement tool, new gate or paid qualification run. Personal/Life Chapter and existing deterministic phrase normalization are outside this removal.

The optional historical editor metadata contract remains readable; saved reports, private cohorts, ledger and prior evaluation edits are preserved. New results omit editor metadata and merge only writer/reviewer usage. Prompt version identifies the new flow. Severe review findings retain the existing one corrective writer retry, then fail; malformed writer output still fails after its existing retry. Reviewer-unavailable behavior remains unchanged. Rejected semantic candidates now point to the writer response.

## Validation and review

Focused engine fixtures prove two successful model calls on both OpenAI and OpenRouter, original writer prose reaching review and result, selected-reader perspective, cost/token totals without an editor, historical metadata readability, malformed writer failure, reviewer-only retry, and severe semantic rejection after exactly one writer-review retry. All provider calls are mocked.

UI patterns/events: N/A; no interface, analytics or navigation change. Focused desktop reader QA covers the existing Ally-to-report journey and private/public evidence separation.

Steward review examines the actual deletion, both provider call sites, retry attribution and accounting fixtures. **Steward decision: accept.** Typecheck, lint, production build and the focused desktop Synastry report journey passed. Lint retains one unrelated pre-existing `_staleNote` warning. Browser QA checked the canonical Ally edit, private evidence and public-share suppression with console/page-error review, using isolated local fixtures and disabled paid keys. No layout/navigation changes justified additional viewport sweeps. The code index was refreshed without AI summaries. No new reusable lesson; the existing playbook records the removal procedure. No deployment, push, paid call or live saved-report mutation.

The spending ledger remains $5.905964. The pre-existing V3.3 evaluation file is byte-identical to its starting state.
