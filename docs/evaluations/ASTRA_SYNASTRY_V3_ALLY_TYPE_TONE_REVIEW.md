---
title: "Synastry V3 Ally Type Tone Review"
status: "proposed"
project: "Astra Clean Start"
created: "2026-07-31"
updated: "2026-07-31"
type: "evaluation"
production_status: "not-approved"
---

# Synastry V3 Ally Type Tone Review

## Current boundary

`Ally.relationship` is currently required free text, while `Ally.kind` only distinguishes broad identity classes such as `person`, `mentor`, or `ancestor`. Astra does not yet have an approved normalized relationship-tone contract. The table below is a review proposal for report generation, not approval to change the schema, UI, production prompt, or saved reports.

The clean-start app on this branch does **not** currently present a relationship-type chooser: Ally onboarding uses a required free-text `Relationship` field and creates every new Ally with `kind: "person"`. The Astria reference app's canonical chooser vocabulary contains 23 tags. Its new-subject picker offers 21 of them by suppressing `client` and `public_figure`; its record editor can select all 23. Astria remains reference material rather than clean-start current-state evidence, but that vocabulary is the fullest existing product list and should be accounted for before a production contract is approved.

A read-only inventory of clean-start stored labels found `child` (4), `client` (1), `Colleague` (18), `friend`/`Friend` (139 combined), `spouse` (1), and `Steady observer` (1). The case split and open-ended observer label confirm that report tone should not branch directly on exact free-text values.

Felicia Weiss is currently stored as Tony Cecala's `spouse`, so the private Felicia + Tony V3 sample uses the existing adult-romantic chapter structure. Romantic and erotic interpretation remains evidence-gated; the label does not prove relationship quality, exclusivity, permanence, or desired outcome. `Lover` is approved here as an explicit clean-start production candidate when this experiment later moves toward production; this document does not implement it yet.

## Complete chooser-coverage table

| Existing chooser tag | Default V3 lens | Adult-romantic treatment | Structure and safety boundary |
| --- | --- | --- | --- |
| `Self` | Natal self, not an Ally relationship | Not applicable | Exclude from Synastry V3 Ally routing; use the natal report path. Its presence in the legacy picker should not make it a valid comparison type. |
| `Family` | Generic family bond | Prohibited | Use family-system chapters and request a more specific role when possible. Do not infer hierarchy, duty, reconciliation, or household history. |
| `Mother` | Parent/child attachment, care, authority, inheritance, and individuation | Prohibited | Use parent-family chapters. Do not prescribe closeness, caregiving, forgiveness, estrangement, or filial duty. |
| `Father` | Parent/child attachment, care, authority, inheritance, and individuation | Prohibited | Use parent-family chapters with the same boundaries as `Mother`; do not derive gendered behavior from the label. |
| `Child` | Caregiving, attachment, development, and growing autonomy | Prohibited without exception | Replace romantic chapters with attachment, caregiving, will and repair, care language, family roles, and the bond as a living system. No eroticization, partner-equivalence, burden assignment to the child, adult motive claims, or deterministic parenting verdicts. |
| `Lover` | Explicit romantic and sexual connection | Lead with romantic and sexual overtones, grounded in the selected interaspects | Use the adult-romantic structure and make attraction, chemistry, and embodied charge the opening frame. Treat desire symbolism, consent, exclusivity, commitment, permanence, and relationship history as separate questions. Add this as an explicit clean-start Ally type only when production work is approved. |
| `Spouse` | Adult-romantic partnership | Allowed when selected interaspects support it | The adult-romantic structure may be used. Never infer marriage history, monogamy, satisfaction, permanence, reconciliation, or stay/leave outcomes. |
| `Partner` | Adult partnership without romantic language | Prohibited | Use neutral partnership chapters. The label alone does not establish romance; select `Lover`, `Spouse`, or `Companion` when the romantic language lens is intended. |
| `Sibling` | Peer-family bond, loyalty, rivalry, differentiation, and repair | Prohibited | Use family-system chapters. Do not sexualize intensity or turn chart contacts into fixed family roles. |
| `Ex` | Former adult-romantic bond | Allowed as historical relational tone when selected interaspects support it | Use a former-relationship structure. Do not infer present contact, unresolved desire, reunion, reconciliation, availability, or a preferred outcome. |
| `Friend` | Friendship with possible adult-romantic overtones | Allowed when selected interaspects support it | Keep the portrait friendship-led while permitting romantic overtones. Do not turn attraction symbolism into actual romance, consent, exclusivity, or destiny. |
| `Companion` | Adult-romantic companionship | Allowed when selected interaspects support it | Use the adult-romantic structure while keeping consent, exclusivity, commitment, permanence, and relationship history unknown. |
| `Business` | Professional collaboration, agreements, power, and trust | Prohibited | Use collaboration chapters. Do not infer off-record romance, financial success, loyalty, authority, or business outcomes. |
| `Colleague` | Professional peer relationship | Prohibited | Use work/collaboration chapters. Translate attraction contacts as interpersonal charge, never romantic or erotic interest. |
| `Mentor` | Learning, authority, projection, boundaries, and growth | Prohibited | Use mentorship/power chapters. Name the structural asymmetry without romanticizing dependency or authority. |
| `Student` | Learning relationship with responsibility and power asymmetry | Prohibited | Use teaching/learning chapters. Do not eroticize authority, dependency, approval, access, or evaluation. |
| `Ancestor` | Lineage, inheritance, memory, and symbolic continuity | Prohibited | Use an ancestral/lineage comparison, not a reciprocal lived-relationship portrait. Do not invent communication, approval, motives, or spiritual claims. |
| `Guide` | Guidance, learning, projection, and boundaries | Prohibited | If the guide is living, use mentorship rules; if symbolic or imagined, use symbolic-comparison rules. Do not invent reciprocity or authority. |
| `Archetype` | Symbolic resonance and projection | Prohibited | Use a symbolic comparison rather than dual lived perspectives. Do not present an archetype as a consenting person or claim actual reciprocal experience. |
| `Historical Figure` | Observational chart comparison | Prohibited | Do not use a reciprocal relationship portrait unless an actual historical relationship is explicitly established. Avoid private-state or counterfactual claims. |
| `Other` | Neutral human connection | Prohibited | Ask for clarification or use neutral chapters. The chart must not decide what the relationship is. |
| `Client` | Professional service relationship with confidentiality and power boundaries | Prohibited | Use professional-service chapters. Do not infer diagnoses, confidential facts, dependence, off-record romance, or service outcomes. |
| `Public Figure` | Observational chart comparison | Prohibited | Use comparison-only language, not claims of mutual influence or lived reciprocity. Avoid invented private motives, contact, endorsement, or consent. |

Coverage result: all 23 canonical Astria chooser tags are now explicitly considered. The clean-start app still needs an approved product decision about which tags should return as selectable Ally types; this table is not permission to copy the old list wholesale.

## Recommended contract

Keep the authored Ally type for display, but derive or request a separate normalized report lens before generation. The minimum useful routing values are:

- `adult-romantic`
- `former-romantic`
- `friendship`
- `companion-neutral`
- `family-generic`
- `family-parent`
- `family-caregiving-child`
- `family-peer`
- `professional`
- `mentorship`
- `ancestral-symbolic`
- `observational`
- `neutral`

The report lens should control chapter vocabulary and prohibited inferences. It should not be guessed solely from astrological contacts. The romantic language whitelist is `Companion`, `Ex`, `Friend`, `Lover`, and `Spouse`, and selected interaspects must still support the language. `Friend` remains friendship-led and permits romantic overtones; the other four may use the full romantic language lens. Every other Ally type prohibits romantic and erotic framing. Child and family-caregiving modes require a distinct non-romantic structure before they are eligible for V3 testing. Symbolic and observational types require comparison structures that do not pretend both parties are participating in a lived relationship.

## Review questions

1. Approved direction: the romantic language whitelist is `Companion`, `Ex`, `Friend`, `Lover`, and `Spouse`; `Friend` permits romantic overtones, `Lover` leads with romantic and sexual overtones, and `Companion`, `Ex`, and `Spouse` permit the full romantic lens. Every other type prohibits romantic framing.
2. Approved direction: add `Lover` as an explicit Ally type when the experiment is approved for production implementation.
3. Still to decide: should `Archetype`, `Historical Figure`, `Public Figure`, and `Ancestor` be eligible for V3 at all, or receive a separate comparison product?

No production change is approved by this evaluation.

## Production-readiness note

When Tony authorizes production edits, add explicit Ally tag selection back to clean-start Ally onboarding and editing. Include `Lover` in the approved selectable set, preserve existing authored free-text relationships during migration, keep the display tag separate from the normalized report-tone lens, and route romantic language only through the approved whitelist. Do not implement the chooser, schema migration, or production prompt routing during the private V3 experiment.

## Three-tone strongest-15 test

Tony Cecala was privately tested with Felicia Weiss as `Spouse`, Marissa Yahil as `Child`, and Cheyenne Autumn as `Lover`. Cheyenne's saved `friend` value remained unchanged; `Lover` was an experiment-only routing override.

The controlled retry demonstrated that tag routing materially changes the portrait in the intended direction: Marissa received a distinct non-romantic family structure with no romantic-language findings, while Cheyenne's Lover portrait explicitly led with romantic and sexual overtones. All three remained held as finished prose because the writer continued to create load-bearing or unequal-cost metaphors; Felicia also retained degree language, Marissa was subtly infantilized despite no age evidence, and Cheyenne invented first-contact texture and ran short. Steward judgment: **accept-with-notes as tone-routing evidence; hold for production**. Private evidence is retained at `.astra-exports/dual-perspective-synastry-bakeoff/2026-07-31-three-sample-v2/`.

## Cheyenne clean-prose psychological-thriller test

One Tony Cecala + Cheyenne Autumn `Lover` variant was generated from the exact same strongest-15 direct chart-signal packet as the current Cheyenne V3. The writer received no saved report or baseline prose. Fifteen unique interaspects plus the timed Moon comparison were assigned 16 stable private evidence IDs; the portrait exposed none of them or any technical astrology language.

The architecture succeeded, but the portrait did not win. It was 1,497 words rather than 2,000-2,600, named Cheyenne only 6 times, omitted the explicit romantic frame from the opening, and retained an unequal-labor metaphor. A blind evaluator preferred current V3: the clean variant improved narrative tension from 7 to 8 and technical cleanliness from 6 to 10, while emotional specificity fell from 8 to 7, perspective balance from 9 to 6, and evidence fidelity from 9 to 5. Fate-coded language such as inevitability and an ancient contract sounded literary but was not tightly licensed by the packet.

The initial automated Steward judgment was **accept-with-notes as architecture evidence; hold as finished prose**. Tony's direct reader review superseded that rejection: he found *The Undertow of Recognition* excellent, clear, simply written, and easier to comprehend. Revised product judgment: **green light as a private experimental portrait**. The length, literal-keyword, name-frequency, fate-metaphor, and contribution-language findings remain review notes rather than proof that the portrait failed. Private evidence and the human-review amendment are retained at `.astra-exports/dual-perspective-synastry-bakeoff/2026-07-31-cheyenne-clean-prose-thriller-v1/`.

### Clean-prose V2

V2 turned the prose further toward feeling-first writing and received a green light under the revised contract: 1,469 measured words, zero technical astrology or visible evidence IDs, 15 valid evidence IDs traced, and no source-report prose supplied to the writer. Its feeling-language density rose to 49.7 per 1,000 words versus Undertow's 40.7 and current V3's 32.4. The blind evaluator again preferred current V3, scoring V2 at 7 emotional specificity, 8 tension, 6 perspective balance, 10 technical cleanliness, and 6 evidence fidelity.

V2 crossed one real line: it fabricated twelve spans of direct dialogue for Cheyenne and asserted a lifelong defense against absence as biography. That is one fatal category, within the approved maximum of two, so the experiment gate remains **green with notes**. The next step-back is narrow: retain the simple, high-density feelings and third-protagonist tension while rendering Cheyenne's interiority as possibility rather than quotation or invented life history. Private evidence is retained at `.astra-exports/dual-perspective-synastry-bakeoff/2026-07-31-cheyenne-clean-prose-thriller-v2/`.

### Final clean-prose synthesis

One final synthesis was generated from the exact same strongest-15 packet and stable `S01`-`S16` identities, with Undertow opened only after writing for blind comparison. It contained zero contextual astrology terms, traced all 16 evidence IDs, and scored 8 emotional specificity, 8 tension, 7 perspective balance, 10 technical cleanliness, and 8 evidence fidelity. Undertow scored 8, 8, 8, 10, and 8 respectively and won the blind preference.

The synthesis remained green with one fatal category: five italicized first-person Cheyenne thoughts functioned as fabricated speech. At 1,201 words it also fell below the 1,500 ±10% band, but length remains a review note. Final experiment judgment: **keep The Undertow of Recognition as the accepted reader benchmark; do not generate another retry**. Private evidence is retained at `.astra-exports/dual-perspective-synastry-bakeoff/2026-07-31-cheyenne-clean-prose-final-synthesis/`.

## Felicia + Tony strongest-15 sample

The private `felicia-tony` sample generated successfully from direct chart signals with the stored `spouse` context:

- 14 unique calculated interaspects plus the timed Moon comparison across 16 evidence slots;
- 4,061 words;
- all 14 interaspects visibly grounded;
- 73 Tony references, 75 Felicia references, and 18 relationship references;
- 11,097 total tokens, $0.090618, and 121.538 seconds;
- no saved-report input and no production or database write.

Steward judgment: **accept-with-notes as experiment evidence; hold as finished prose**. The architecture transferred and perspective balance was strong, but the output corrupted decimal degrees into degree-minute notation, treated `spouse` as evidence of marriage history and permanence, and drifted toward unequal-contribution claims. The private evidence is retained at `.astra-exports/dual-perspective-synastry-bakeoff/2026-07-31T17-20-44-172Z/`.
