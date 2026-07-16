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

1. Astra asks the writer for one private governing thesis from all nine section planning cards. The target is 35-75 words; a coherent thesis remains valid up to 90 words because it is private planning context, not customer copy.
2. Each chapter receives that shared thesis and only its own section signal card.
3. Astra writes up to three chapters concurrently.
4. Every chapter is validated independently for its heading, depth, supported chart claims, and natal timing language.
5. Only a failed chapter is retried, up to three total attempts. Successful chapters are never regenerated because another chapter failed.
6. Astra assembles accepted chapters in the code-owned heading order, derives the summary from Identity, and retains deterministic public signals and Chart Evidence.

Identity must ground its opening in the correct Sun sign and house context within the first three sentences. Two short human hooks before that evidence are valid; requiring the factor in sentence one or two caused proven rewrites of otherwise sound prose.

The model never owns section order, evidence rendering, report provenance, or public metadata. The thesis is an ephemeral writing compass and is not customer-facing report content.

Generation metadata records the thesis and every chapter's attempts, tokens, estimated spend, and model latency. Every rejected attempt also retains structured failure codes, human-readable reasons, its available token/spend/latency data, and the rejected prose for private audit. Aggregate latency is wall-clock time; chapter latencies overlap because concurrency is intentional.

## Visible Output Budget

OpenRouter models can spend completion tokens on extended reasoning as well as customer-visible prose. Deep Report generation therefore sends `reasoning.effort: none` for its OpenRouter writer calls. The governing thesis and section signal cards already perform the planning split; the model call's job is to turn that resolved context into a bounded chapter. The 1,400-token chapter allowance is reserved for visible prose rather than shared with an implicit reasoning budget.

Generation metadata records the requested reasoning effort, provider-reported reasoning tokens, and finish reason. This makes a future provider or model-default change observable instead of inferring truncation from word counts after the fact.

The controlled Felicia comparison used the same immutable Tropical, Whole Sign chart snapshot and Claude Sonnet 5 before and after this policy:

| Measure | Default reasoning | Reasoning disabled |
|---|---:|---:|
| Attempts | 14 | 11 |
| Depth retries | 3 | 0 |
| Total retries | 4 | 1 |
| Writer spend | $0.1688 | $0.0838 |
| Wall-clock time | 92 seconds | 50 seconds |
| Report words | 3,253 | 3,197 |
| Chart references per 1,000 words | 25.5 | 28.2 |
| Practical sentences | 28 | 35 |

All nine chapters kept their existing depth floors on the first attempt. The one remaining retry was the separate public-language rule for `the person`; the later audit below narrows that rule using retained production evidence.

## Plainspoken Voice And Retry Audit

The recovered Astria Plainspoken contract is now explicit in every Deep chapter prompt:

- Target roughly a 6th-8th grade reading level without reducing the insight. Grade 6 is acceptable when the voice remains adult, specific, and psychologically useful.
- Use everyday words, direct statements, observable behavior, and short-to-medium sentences.
- Say what happens, what it costs, and what can change.
- Sound warm, experienced, and lived-in without academic, clinical, ornate, or stylized dialect.
- Preserve adult psychological nuance. Plain does not mean childish or clipped.

Flesch-Kincaid grade, reading ease, sentence length, and polysyllabic-word rate are recorded with each completed sectioned Deep Report. They are advisory telemetry, not retry gates. Astrology vocabulary and proper names make formulaic grade levels imprecise; buying a new chapter solely to satisfy a readability formula would repeat the validator-cost problem this audit is correcting.

Rejected chapter or thesis prose is retained with its structured retry reason, token use, spend, and latency in the same private generation record. It is not rendered in Library or shared-report pages. Retention makes false-positive review possible without guessing from a reason code.

The retry audit narrowed only cases supported by retained evidence:

1. `the person` and `this person` are no longer forbidden substrings. A sentence-level rule rejects direct subject labels such as `This person tends to...` while allowing natural phrases such as `the person you choose`.
2. A coherent private governing thesis may be up to 90 words. The target remains 35-75, but an 86-word thesis proved that the previous hard maximum could reject useful internal context with no customer-facing benefit.
3. Identity may use two short human hooks before naming the correct Sun sign and house context. The chart factor must appear within the first three sentences; two production drafts proved the old first-or-second-sentence rule rejected correctly grounded prose.

Provider failures, invalid output shape, missing chapters, section depth, unsupported chart claims, evidence mismatch, invented natal timing, debug/schema leakage, and missing Identity evidence remain retry-worthy.

The three-Ally cohort used each Ally's same saved Tropical, Whole Sign chart and Claude Sonnet 5:

| Measure | Before | Plainspoken cohort |
|---|---:|---:|
| Average estimated grade | 10.4 | 5.8 |
| Average words per sentence | 20.9 | 13.8 |
| Total retries | 10 | 1 |
| Total writer spend | $0.4088 | $0.2404 |
| Total model time | 227 seconds | 135 seconds |

Cheyenne, Brandi, and Felicia all preserved or increased report length and chart-reference density. The aggregate cost change also includes the earlier visible-output-budget correction for Cheyenne and Brandi, so it is not attributed to voice or retry narrowing alone. Felicia is the cleanest incremental control: one broad phrase retry became zero, while spend moved from $0.0838 to $0.0788.

A follow-up Cheyenne control removed stock question openings across all nine chapter openings. Its two retained retries both showed valid `Sun in Scorpio` evidence in sentence three; the final three-sentence Identity rule accepts that exact case in the deterministic quality suite without weakening the requirement that the opening be grounded in the actual chart.

## Direct Openings And Paragraph Shape

Deep chapters should begin with a direct second-person statement using `You` or `Your`, not with an announced question such as `Here's the question...`. This is a voice preference, not a retry gate. The chapter prompt also asks for two or three purposeful paragraphs.

Library previously collapsed all repeated whitespace while removing legacy boilerplate. That erased authored blank lines and rendered every chapter as one wall of text. The renderer now preserves the exact word order while presenting each chapter as at most three balanced paragraphs. Existing reports improve without changing stored historical content; new reports usually arrive with three authored paragraphs already.

The Brandi and Felicia production control used their unchanged Tropical, Whole Sign charts and Claude Sonnet 5:

| Measure | Brandi | Felicia |
|---|---:|---:|
| Direct `You` or `Your` openings | 9 of 9 | 9 of 9 |
| Authored paragraphs per chapter | 3 | 3 |
| Estimated grade | 7.4 | 7.4 |
| Retries | 0 | 0 |
| Writer spend | $0.0816 | $0.0835 |

This presentation follows `05-progressive-disclosure.md`: readable prose comes first, with deterministic Chart Evidence available as the next layer. No analytics event was added because paragraph formatting does not represent a user action.

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
