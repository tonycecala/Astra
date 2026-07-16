# Natal Integration and Deep Report Quality

## Decision

New Natal Core and Deep Reports end with **Integration**, not **Right Now**.

- Natal reports explain enduring person and chart patterns.
- Integration turns those enduring patterns into a practical way of working with the chart.
- Progressed Reports own dated present-tense interpretation through **Current Chapter** and an explicit **AS OF** date.
- Historical report headings and prose remain unchanged.

## Recovered Writer Value

The valuable parts of the earlier Astra writer are preserved as production requirements:

1. Code builds section-specific signal cards with capacities, risks, tensions, developmental tasks, and selected evidence.
2. The model writes prose rather than serializing application data.
3. Astra renders chart evidence deterministically from the selected signals.
4. Deep Reports must sustain useful depth across all nine chapters, not only Identity.
5. Validators reject shallow chapters, unsupported chart claims, and invented timing language.
6. Deep model calls have a longer timeout than shorter report families because validated premium prose can require a rewrite.

## Deep Depth Contract

- Identity: 400-500 words; hard floor 350.
- Emotions, Relationships, Work: 300-425 words each.
- Drive, Gifts, Blind Spots, Growth: 275-400 words each.
- Integration: 225-325 words.
- Complete report: hard floor 2,625 words.

The target is not length for its own sake. Each chapter must use a distinct governing question and interpret repeated chart signals through that chapter's life domain rather than repeating the same warning or practice.

## Sectioned Deep Generation

Deep Reports use `sectioned-v1` orchestration:

1. Astra asks the writer for one private 35-75 word governing thesis from all nine section planning cards.
2. Each chapter receives that shared thesis and only its own section signal card.
3. Astra writes up to three chapters concurrently.
4. Every chapter is validated independently for its heading, depth, supported chart claims, and natal timing language.
5. Only a failed chapter is retried, up to three total attempts. Successful chapters are never regenerated because another chapter failed.
6. Astra assembles accepted chapters in the code-owned heading order, derives the summary from Identity, and retains deterministic public signals and Chart Evidence.

The model never owns section order, evidence rendering, report provenance, or public metadata. The thesis is an ephemeral writing compass and is not customer-facing report content.

Generation metadata records the thesis and every chapter's attempts, tokens, estimated spend, and model latency. Every rejected attempt also retains structured failure codes, human-readable reasons, and its available token/spend/latency data. Rejected prose is not persisted. Aggregate latency is wall-clock time; chapter latencies overlap because concurrency is intentional.

## Recovered Report Comparison

The first production comparison used Tony's unchanged Tropical, Whole Sign Self chart and Claude Sonnet 5 for both reports.

| Measure | Recovered monolith | Sectioned v1 |
|---|---:|---:|
| Words | 2,988 | 3,205 |
| Writer spend | $0.0873 | $0.1506 |
| Wall-clock time | 108 seconds | 101 seconds |
| Repeated sentences | 0% | 0% |
| Chapter distinctness | 87.0% | 85.3% |
| Chart references per 1,000 words | 36.5 | 26.5 |
| Practical sentences | 19 | 25 |

The sectioned report preserved all depth floors, improved practical application, and completed slightly faster. It was less astrology-term-dense and cost 73% more because Identity, Relationships, Work, and Growth required local retries. This is an accepted first-run tradeoff, not a claim that sectioning is automatically cheaper. Section-level telemetry now makes retry frequency and economics measurable so future prompt/validator tuning does not risk a full-report rewrite.

The private comparison artifact can be regenerated without another model call:

```bash
npm run report:compare-deep -- --email astramaster@tony.io --request-id <sectioned-report-id> --output <comparison.md>
```

## Cost Optimization Order

The first sectioned run spent about $0.021 on input and $0.129 on output. Prompt caching can only reduce the smaller input component; rejected chapter rewrites are the larger economic lever.

Optimize in this order:

1. Improve first-pass chapter acceptance and use section telemetry to identify repeated validator failures.
2. Preserve controlled concurrency for wall-clock latency.
3. Add explicit short-lived Anthropic prompt caching only when a natural shared prefix meets the provider's minimum cacheable length. Do not pad prompts merely to qualify for caching.
4. Do not use response caching for purchased reports because customers require a fresh interpretation, not a verbatim cached completion. Response caching remains appropriate for identical internal test requests.

OpenRouter's current cache contract is documented in [Prompt Caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching) and [Response Caching](https://openrouter.ai/docs/guides/features/response-caching).
