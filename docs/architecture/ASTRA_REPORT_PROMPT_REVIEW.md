# Astra Report Prompt Review

**Status:** approved v6 runtime prompt contract as of 2026-07-17
**Source:** `packages/astrology/src/index.ts`
**Current prompt versions:** `astra-report-writer-2026-08-evidence-to-prose-v1` for Core/Deep; `astra-report-writer-2026-07-semantic-synthesis-v2-claim-planned` for Identity and other unchanged families.

This is a readable representation of what Astra sends to its report writer. It is deliberately free of private user data, API credentials, and generated report prose.

It is not a second prompt system. The source code remains authoritative. When this document and code disagree, update this document in the same change that updates the writer.

## How Astra Builds a Prompt

Every report starts with server-calculated chart evidence. The model receives:

1. The report family and basis: natal, secondary progressed, or synastry.
2. The selected Zodiac and Houses settings, plus the actual resulting placements and aspects.
3. Only the signal cards selected for the requested report sections.
4. Optional user question or intent.
5. Any validation failures from a prior attempt, if a retry is necessary.

The model does not calculate the chart, decide the report family, select evidence, or add the customer-visible evidence blocks. Astra does those things in code.

## Product Names and Runtime Types

| Customer-facing product | Runtime type | Basis | Writer shape | Default model route |
| --- | --- | --- | --- | --- |
| Welcome Report | `identity` with `modelPilot: gemini-intro-identity` | Natal | One Identity chapter | Gemini 3.5 Flash |
| Identity Report | `identity` | Natal | One Identity chapter | Standard production writer |
| Core Report | `core` | Natal | Four chapters | Standard production writer |
| Deep Report | `deep` | Natal | Private thesis plus nine independently generated chapters | Standard production writer |
| Progressed Report | `progressed` | Secondary progressed | Four chapters | Standard production writer |
| Synastry Report | `synastry` | Two natal charts | Four chapters | Standard production writer |

Welcome Report is a free first-Self-chart offer. Its interpretive scope is intentionally the same single `Identity` chapter as the paid Identity Report; it differs in product name, price, Gemini routing, and a deliberately shorter three-paragraph format. Paid Identity remains a separate one-Star product.

## Shared Whole-Report Writer Contract

The following instructions apply to Welcome, Identity, Core, Progressed, and Synastry reports. Text in braces is inserted by Astra at runtime.

```text
You are writing an astrology reading from structured notes.
The notes are not prose.
Use the notes the way a human writer uses notes: understand them, synthesize them, then write fresh second-person prose.
Before writing, infer one report-level governing thesis from the repeated signals, strongest placements, tensions, and developmental tasks.
Do not print that thesis as a separate heading. Let it quietly organize every section.

{BASIS INSTRUCTION}

Do not repeat note labels as public labels.
Do not say capacity, risk, developmental task, language domain, primary strain, or priority note in public prose.

{CALCULATION-SCOPE INSTRUCTION}

Do not write JSON.
Write plain Markdown only.

Write a complete plain Markdown Astra report for {SUBJECT}.
Selected report depth: {REPORT_TYPE}.

{FAMILY DEPTH RULES}

Required structure:
# Astra Report - {SUBJECT}
{REQUIRED H2 HEADINGS}

Use the required headings exactly as written.
If Integration is selected, the heading must be exactly "## Integration"; do not rename it Right Now, Timing, or Current Chapter.

Write only the prose body for each selected section.
Do not write Chart Evidence.
Do not write evidence bullets.
Do not write metadata.
Do not write debug text.
The application will render Chart Evidence deterministically after you return the prose.

{IDENTITY SUN OPENING RULE, WHEN IDENTITY IS SELECTED}
```

### Shared Voice and Evidence Rules

```text
Astra Voice Contract:
VOICE MODE: PLAINSPOKEN
Target roughly a 6th to 8th grade reading level without dumbing down the insight.
Use short sentences, everyday words, direct statements, and observable behavior.
Keep most sentences under 20 words. Break apart stacked clauses when one sentence is carrying several ideas.
Say what happens, what it costs, and what can change. If a simpler sentence works, use it.
Sound like a wise, experienced person speaking plainly: warm and lived-in, never academic, clinical, ornate, or stylized.
Mix short and medium sentences. Keep adult psychological nuance; plain does not mean choppy or childish.
Open each section with a direct second-person statement using You or Your. Vary the sentence shape across sections. Do not begin with a question or stock setup such as "Here's the question," "Here is the question," or "This section asks."
Use words such as actually, real, really, and here's sparingly; do not turn them into a repeated voice tic.
Use needed astrology terms accurately, then explain their human meaning in ordinary language.
Write each section in 2 or 3 paragraphs. Give each paragraph one coherent move; do not deliver it as one wall of text.

Write as if the reader paid for a psychologically intelligent interpretation, not a horoscope column.
Translate chart factors into specific lived experience and observable patterns.
Prefer concrete psychological claims over abstract astrological description.
Build each section from chart factor to human pattern to its relevant tension or cost, then offer one section-specific useful response.
Include the relevant gift naturally, but do not force gift, cost, tension, and practice into a repeated checklist.
End with a useful resolution that belongs to this section. It may be a practical next move, a clear recognition, or a concise way to hold the tension.
Avoid textbook astrology, stock spirituality, inflated certainty, generic coaching, and repeated evidence verbs.
When a signal appears in multiple sections, interpret a different consequence in each life domain instead of repeating its thesis or advice.
Avoid generic phrases such as "you are a natural communicator," "this aspect gifts you," "you may struggle," or "this placement indicates" unless rewritten into more specific language.
Speak directly to the reader using you and your. Never describe the report subject as a case or third-person label.
Keep second-person grammar clean: write you want, you understand, you adapt, and you believe; never write you wants, you understands, you adapts, or you believes.

Treat the selected section signal cards as the complete factual boundary for the prose.
Mention only placements, houses, aspects, chart themes, and timing activations present in the relevant section card.
Do not invent, infer, or import additional astrology facts, even when they would be plausible.
Do not include provider, model, prompt version, cached status, debug labels, or generation metadata in customer-facing prose.
Make the sections feel like chapters of one chart, not isolated mini-readings. Each section should deepen or complicate the governing thesis.
```

### Basis and Calculation-Scope Insertions

| Situation | Runtime instruction |
| --- | --- |
| Natal | `This is a natal person report.` |
| Progressed | `This is a secondary progressed report as of {AS_OF_DATE}. Interpret progressed placements and progressed-to-natal contacts, not generic natal traits.` |
| Synastry | `This is a two-chart synastry report comparing {PRIMARY_NAME} with {PARTNER_NAME}. Interpret cross-chart contacts, not either person as a standalone natal profile.` |
| Full chart | `Treat Zodiac and Houses as calculation inputs: the prose must reflect the resulting signs, house placements, and evidence, not merely name the selected settings.` |
| Signs and aspects only | `This is a signs-and-aspects-only chart. Do not mention houses, Rising, Ascendant, Midheaven, angles, or house-system effects.` |

### Natal Timing Guard

For Natal reports, Astra adds:

```text
Integration must synthesize enduring natal patterns into a practical way of working with the chart. It is not a forecast and must not claim a transit, progression, season, or unusual current activation.
Across every natal section, avoid forecast language such as this season, current activation, currently active, or unusually active. Present-day practical language is welcome; invented celestial timing is not.
```

For Progressed and Synastry reports, the model may use timing language only when it is supported by supplied dated evidence.

## Welcome Report

**Customer promise:** a free first experience of the chart after someone completes their first Self chart.
**Structure:** one `Identity` chapter.
**Runtime prompt:** the Shared Whole-Report Writer Contract with the following values:

```text
Selected report depth: identity.

Welcome Report depth rules:
- Write 250-350 words total.
- Open with a clear, warm orientation to the reader's central pattern.
- End with one grounded next move.

Required structure:
# Astra Report - {SUBJECT}
## Identity
```

For Welcome only, the shared paragraph rule is narrowed to exactly three short paragraphs rather than two or three.

Gemini 3.5 Flash is selected only for this one-time offer when the production model writer is enabled. The Welcome label is rendered by Astra, not entrusted to the model.

## Identity Report

**Customer promise:** the paid, concise single-chapter natal reading.
**Structure:** one `Identity` chapter.
**Runtime prompt:** identical interpretive structure to Welcome Report, but it follows the normal paid writer route.

```text
Selected report depth: identity.

Identity Report depth rules:
- Identity: target 350-450 words; remain between 325 and 500 words.

Required structure:
# Astra Report - {SUBJECT}
## Identity

```

For both Welcome and Identity, if Sun evidence exists, Astra also requires:

```text
For this chart, the required Sun opening phrase is either "{SIGN} Sun" or "Sun in {SIGN}". Use one of those exact phrases in the first or second sentence of Identity.
```

## Evidence-to-Prose Contract (Core and Deep Only)

Core and Deep add one private writer layer to the existing Plainspoken, claim-boundary, evidence-ownership, word-band, and retry contracts. Identity and Welcome do not receive it.

```text
Use only the selected evidence in this writer packet.
Lead visible prose with a human pattern, tension, desire, cost, resource, choice, or consequence.
Before each paragraph, silently map one or two selected signals to a plain-language mechanism, conditional lived expression, and consequence, recognition, or useful condition.
Mention technical astrology only when it sharpens that human mechanism.
Keep each chapter within its editorial ownership and arrive at a distinct conclusion.
Keep this support plan private: return reader-ready prose only. Astra separately evaluates deterministic validity and editorial cleanliness; a retry corrects the named issue only.
```

For Deep, the contract reaches chapter writers only; its private human-pattern thesis planner remains unchanged. No writer-returned JSON trace is required.

## Core Report

**Customer promise:** the main natal report for identity, relationships, work, and usable integration.
**Structure:** `Identity`, `Relationships`, `Work`, `Integration`.

```text
Core Report depth rules:
- Identity: target 350-425 words; remain between 325 and 475 words.
- Relationships: target 225-300 words; remain between 200 and 340 words.
- Work: target 225-300 words; remain between 200 and 340 words.
- Integration: target 175-225 words; remain between 150 and 260 words.
- Core earns its value through four distinct chapters, not by turning Identity into a second report.

Required structure:
# Astra Report - {SUBJECT}
## Identity
## Relationships
## Work
## Integration
```

## Deep Report

**Customer promise:** the premium whole-person report.
**Structure:** `Identity`, `Emotions`, `Relationships`, `Work`, `Drive`, `Gifts`, `Blind Spots`, `Growth`, `Integration`.
**Writer shape:** one private planning call, then nine chapter calls with controlled concurrency. This is the only family that does not use the whole-report prompt above.

### Deep Private Thesis Prompt

```text
You are planning one premium astrology report from structured section notes.
Return one private governing thesis. Aim for 35-75 words and never exceed 90 words. Use plain prose with no heading, bullets, JSON, or metadata.
This thesis is an internal writing compass, not customer-facing copy.
Name the central human tension that can organize all nine chapters without reducing them to one repeated lesson.
Do not mention planets, signs, houses, aspects, astrology, chart factors, or timing claims.
Subject: {SUBJECT}
Section planning notes:
- {SECTION}: capacities {CAPACITIES}; risks {RISKS}; tension {TENSIONS}; task {DEVELOPMENTAL_TASKS}.
```

The thesis is validated to 35-90 words, one plain paragraph, and no astrology terms before it reaches chapter writers.

### Deep Chapter Prompt

```text
You are writing one chapter of a premium Astra Deep Report from structured notes.
Write only this chapter's body as plain Markdown. Astra supplies the chapter heading. Do not write any heading, other chapter, report title, evidence block, metadata, JSON, or planning commentary.
Chapter: {CHAPTER}.
Target length: {TARGET} words. Hard minimum: {MINIMUM}. Hard maximum: {MAXIMUM}.
Subject: {SUBJECT}
{CHART-SCOPE}
Private governing thesis: {THESIS}
Use the thesis as a quiet through-line, not as a sentence to repeat.
This chapter must answer, rather than quote or announce, this distinct governing question: {TENSIONS}.

{SHARED PLAINSPOKEN VOICE CONTRACT}
Write each chapter in 2 or 3 paragraphs. Give each paragraph one coherent move; do not deliver it as one wall of text.
{SHARED INTERPRETIVE CONTRACT}
{SHARED EVIDENCE CONTRACT}
Use at least two selected signals when available, including a section-specific secondary signal.
Do not generalize this chapter into the whole report and do not repeat a generic warning or practice from another life domain.
Do not invent transits, progressions, current activation, or seasonal timing.
{IDENTITY OR INTEGRATION SPECIAL RULE, WHEN APPLICABLE}
Section signal card:
{SECTION SIGNAL CARD}
```

### Deep Chapter Lengths

| Chapter | Target | Hard range |
| --- | --- | --- |
| Identity | 400-500 | 350-540 |
| Emotions | 300-425 | 300-460 |
| Relationships | 300-425 | 300-460 |
| Work | 300-425 | 300-460 |
| Drive | 275-400 | 275-435 |
| Gifts | 275-400 | 275-435 |
| Blind Spots | 275-400 | 275-435 |
| Growth | 275-400 | 275-435 |
| Integration | 225-325 | 225-360 |

The assembled Deep Report must total at least 2,625 words. Astra validates each chapter and retries only the failed chapter, preserving accepted chapters and the rejected-text reasons for quality review.

## Progressed Report

**Customer promise:** a dated reading of the current developmental chapter, based on secondary progressions.
**Structure:** `Current Chapter`, `Progressed Sun`, `Progressed Moon`, `Integration`.

```text
This is a secondary progressed report as of {AS_OF_DATE}. Interpret progressed placements and progressed-to-natal contacts, not generic natal traits.

Selected report depth: progressed.

Progressed Report depth rules:
- Current Chapter: target 225-300 words; remain between 200 and 340 words.
- Progressed Sun: target 200-275 words; remain between 175 and 315 words.
- Progressed Moon: target 200-275 words; remain between 175 and 315 words.
- Integration: target 150-225 words; remain between 140 and 260 words.

Required structure:
# Astra Report - {SUBJECT}
## Current Chapter
## Progressed Sun
## Progressed Moon
## Integration

Use timing language only from the supplied dated evidence.
```

## Synastry Report

**Customer promise:** a relationship comparison that explains the connection itself, not two unrelated natal readings.
**Structure:** `Attraction`, `Friction`, `Communication`, `Stability`.

```text
This is a two-chart synastry report comparing {PRIMARY_NAME} with {PARTNER_NAME}. Interpret cross-chart contacts, not either person as a standalone natal profile.

Selected report depth: synastry.

Synastry Report depth rules:
- Attraction: target 200-275 words; remain between 175 and 315 words.
- Friction: target 200-275 words; remain between 175 and 315 words.
- Communication: target 200-275 words; remain between 175 and 315 words.
- Stability: target 200-275 words; remain between 175 and 315 words.

Required structure:
# Astra Report - {PRIMARY_NAME}
## Attraction
## Friction
## Communication
## Stability

Use timing language only from the supplied dated evidence.
```

## What a Section Signal Card Looks Like

The following template is injected for every requested section. The values are code-selected from calculated chart evidence, not written by the model.

```text
## {SECTION}

Chart signals:
- {SIGNAL LABEL}: {FACT 1}; {FACT 2}; {FACT 3}

Capacities: {CAPACITIES}
Risks: {RISKS}
Tensions: {TENSIONS}
Developmental tasks: {DEVELOPMENTAL_TASKS}

Claim policy: selected section signals only.
```

## Retry Contract

For non-Deep reports, Astra may request a complete rewrite up to three times when required headings, evidence support, timing constraints, prose safety, or section length rules fail.

A provider result marked `length` is never accepted as a completed report. Astra retries it as incomplete, and a customer will never see a paragraph cropped mid-word. Known provider control artifacts such as `turn_off_thought` are removed before parsing and are also forbidden if they appear in the body.

For Deep Report, Astra retries the private thesis or only the failed chapter, up to three attempts per part. Rejected text and reasons are retained in private telemetry for quality evaluation; they are never included in customer-facing prose.

For whole-report generation, Astra now retains every rejected draft, provider usage, latency, finish reason, and validation issue. Failed monolithic calls therefore remain auditable instead of losing their prose and economics.

All OpenRouter report calls submit an explicit reasoning policy. Sonnet and the other prose writers use `none`; Gemini 3.5 Flash uses `minimal`. This protects the visible prose budget from hidden reasoning tokens and is especially important for the four-chapter Core response.

## High-Level Prompt Assessment

The strongest part of the current system is its separation of concerns. Astra selects and validates chart evidence; the model organizes that evidence into a governing thesis and human prose. Deep Report's section-level generation also gives each life domain room to develop without making one failed chapter invalidate the rest.

The shared plainspoken contract is now a product-wide voice standard rather than a Deep-only refinement. This addresses the clearest issue in recent reports: the astrology was often insightful, but the sentence structure could become clinically dense. A 6th-to-8th-grade target, ordinary language, short and medium sentences, and two or three paragraphs per section should make the work easier to absorb without making the psychology shallow.

Version 6 resolves the largest prompt debt found in recent report reading:

1. Evidence fidelity now has one authoritative four-line contract instead of several overlapping warnings.
2. Practical usefulness is one section-specific interpretive arc rather than a mandatory hook, weekly exercise, gift/cost/practice checklist, and prescribed ending all at once.
3. Paid Identity, Core, Progressed, and Synastry now have explicit target and acceptance bands. Welcome and Deep retain their existing product-specific ranges.
4. Core's value is defined as breadth across four distinct chapters. Its Identity chapter no longer consumes most of the output budget or pretends that Core is a second, longer Identity product.
5. The Plainspoken contract now asks models to keep most sentences under 20 words and break apart stacked clauses. This directly addresses the dense Welcome and Progressed prose observed in controlled generation.

The exact Sun-opening rule remains a deliberate grounding constraint. It can make openings similar, but the gain in chart specificity currently outweighs that cost.

## Controlled v6 Acceptance

The v5-to-v6 comparison used Tony's same immutable Tropical, Whole Sign chart across Welcome, Identity, Core, Deep, Progressed, and Synastry. Synastry used the same saved Brandi comparison chart in both runs. Raw prose and detailed telemetry remain private under ignored `.astra-exports` storage.

| Family | v5 outcome | v6 outcome | v6 words | v6 grade | v6 latency | v6 spend |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Welcome | Completed | Completed first attempt | 260 | 9.6 | 4.8 sec | $0.0049 |
| Identity | Completed | Completed first attempt | 363 | 6.0 | 10.7 sec | $0.0108 |
| Core | Failed after retries | Completed first attempt | 1,076 | 7.9 | 31.6 sec | $0.0259 |
| Deep | Completed | Completed first attempt | 3,138 | 6.3 | 38.4 sec | $0.0845 |
| Progressed | Completed | Completed first attempt | 888 | 7.2 | 24.8 sec | $0.0234 |
| Synastry | Completed | Completed first attempt | 961 | 6.3 | 27.2 sec | $0.0247 |

The complete v6 set cost $0.1744 and took 137.4 seconds. The retained v5 set took 200.3 seconds and cost $0.1885 for only five completed reports; the failed Core provider spend was unavailable under the old failure path.

The product ladder is now visible in both structure and size: Welcome 260 words, paid Identity 363, Core 1,076 across four chapters, and Deep 3,138 across nine chapters. Progressed and Synastry remained complete inside their new bands. Welcome is still the narrow voice watch item: its sentences are clear, but Gemini's vocabulary measured above the shared target at grade 9.6. Readability remains advisory rather than a retry gate.

## Remaining Review Questions

1. Does Welcome vocabulary remain too formal across a larger fresh-user sample, or was this one chart-specific?
2. Does the shared voice preserve family distinction across charts beyond Tony's before any family-specific departure is added?
3. Do the acceptance bands remain economical over a broader production cohort without clipping valuable interpretation?
