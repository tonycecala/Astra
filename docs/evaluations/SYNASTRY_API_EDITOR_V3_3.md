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

Pending. The supervising reader will evaluate untouched saved outputs. Code/fixture success alone cannot qualify prose quality.
