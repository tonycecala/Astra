# Adult voice and API editing — V3.3

## Owner direction and scope

The final hand-edited TC–CA sample scored FK 4.3 with 10.3 words per sentence. Tony found the cadence childlike and approved roughly grade 7–9. This is adult plain language, not a race to the lowest score. Sentences should vary and join related thoughts naturally. No manual post-generation polishing may count as production acceptance.

This patch wires Synastry's missing prose editor into the same generation function called by the app. Personal and Life Chapter already use the V4.9 API writer/editor/gate. No deployment, database migration, historical report rewrite or public sharing is authorized.

## Implementation

- Synastry V3.3: selected packet → writer → Opus 4.8 prose editor with extra reasoning disabled → existing independent semantic review of the **edited** prose → save that exact prose and matching trace.
- Editor receives the same evidence, relationship tone and reader, returns the complete final reading and updated paragraph trace, and preserves the six headings. No hand-authored report is fed into the API.
- Malformed/truncated editor output or broken final support fails closed; there is no silent unedited success. Existing writer-attempt limits bound further generation. Semantic-reviewer unavailability retains the pre-existing private-note behavior after its bounded retry; it is not represented as completed semantic review.
- Severe semantic misrepresentation cannot be accepted merely because the older two-category allowance would permit it. Generic inferred motives and minor style near misses remain permitted.
- Every Synastry OpenRouter call is pinned to the existing private Amazon Bedrock route, denied data collection, ZDR and no fallback. The editor uses the qualified Opus endpoint; no cheaper-model promotion was justified by the earlier one-case test.
- Optional backward-compatible editor metadata records model, version, usage, spend and latency. Total report usage includes the editor. Legacy OpenAI paths use their configured model for editing rather than silently moving data to OpenRouter.
- Plainspoken, warm, playful adult voice is shared by writer and editor. The private trace retains explanation; visible paragraphs no longer have to recite a mechanism, example and consequence in that order. No mandatory long ending. The relationship tone still governs whether romance is appropriate.

## Bounded live check, fixed before acquisition

Run the owner's specified three cases once: Tony Personal, Tony Life Chapter at the frozen September 18 date, and TC–CA romantic potential. Use `run-portraits-v4.mts api-wired`, the production engine and only existing bounded retries. Additional OpenRouter ceiling $1.50 from cumulative $4.395551, inside the original $30 total. Preserve failures and source hashes. Stop after those cases; no new bakeoff, no manual final edits, no new independent literary-grade claim. Report actual costs and observed grade/rhythm. Reading grade is advisory, not an acceptance gate.

## Validation and result

The supervising reader evaluates untouched saved outputs; code/fixture success alone cannot qualify prose quality.

### Local verification

- `npm run test:portraits-v4`, `npm run test:synastry-v3-validation`, `npm run test:synastry-v3-packet`, `npm run test:portrait-prose`: passed.
- `npm run test:synastry-v3-engine`: passed. Covers writer→editor→semantic propagation, reciprocal reader, edited output persistence, malformed/truncated editor and changed-heading failures, reviewer-unavailable notes, and mocked OpenRouter Sonnet/Opus routing. Per-call costs .01/.02/.003 merge to .033 with .02 editor metadata. A test initially expected the Opus provider tag for Sonnet; fixed the fixture to assert each model's actual qualified tag, without weakening runtime policy.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed after final runtime changes. Lint retains the pre-existing unrelated `_staleNote` warning.
- `node --env-file=/Users/tony/Documents/Projects/Astra/apps/astra-web/.env.local /tmp/portraits-v4-qa.mjs npm run test:e2e:all -- portraits-v4.spec.ts synastry-v3-production.spec.ts --output .astra-exports/portraits-v4/api-editor-v3-3/browser-qa`: 9/9 passed, automated local Better Auth sessions, isolated QA database, desktop/tablet/mobile. Report ordering, gifted-Star debit, failed-generation retry, immutable reader and owner/public evidence separation verified by Playwright. Browser fixtures have no paid model keys; real provider behavior is checked separately by the live harness.

Pre-existing governance installation/metadata warnings remain unrelated; no actionable Mail. No new deployments or saved-report writes. Luna owned only the bounded engine fixtures; parent owned runtime, cost envelope and literary judgment.

### Live result and Steward decision

All three planned API runs completed. Private cohort: `.astra-exports/portraits-v4/api-wired-2026-09-19T15-30-34.757Z/`; `REVIEW.md` links the untouched final outputs and records parent judgment. Personal grade 7.7/cost $0.282782; Life Chapter 8.1/$0.174315; TC–CA 8.8/$0.357187. Total $0.814284, cumulative $5.209835. No manual post-generation editing, additional bakeoff, or unexpected database writes. The selected date remains frozen, not silently changed to the current date.

The Synastry editor cost $0.243700 with 11,590 input and 7,430 output tokens (zero reasoning tokens), because this implementation re-emits both prose and the full trace. This materially exceeds the earlier prose-only editorial test. All expenses are retained; no cost-efficiency claim is made.

**Steward: accept-with-notes for local API wiring; do not promote as qualified writing.** Actual diff and tests verify editor dispatch, edited-output/trace flow, backward-compatible metadata, total usage and fail-closed editor behavior. Parent read every complete live output. Adult cadence improved, but Life Chapter remains too inward/psychological. Synastry still explains withdrawal as something other than lost interest; its semantic reviewer called unsupported claims minor, letting the report complete. Internal packet phrasing also escaped into visible prose. These are recorded as unresolved literary/materiality failures, not repaired by hand or hidden behind successful transport/tests.

The next bounded improvement is the automated editorial/review contract, including explicit material-boundary findings and edit/trace deltas to reduce reserialization cost. The current run is preserved and not repeated until a prospective implementation change is made. No deployment authorized or attempted.
