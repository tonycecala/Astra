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

A read-only inventory of current labels found `child` (4), `client` (1), `Colleague` (18), `friend`/`Friend` (139 combined), `spouse` (1), and `Steady observer` (1). The case split and open-ended observer label confirm that report tone should not branch directly on exact free-text values.

Felicia Weiss is currently stored as Tony Cecala's `spouse`, so the private Felicia + Tony V3 sample uses the existing adult-romantic chapter structure. Romantic and erotic interpretation remains evidence-gated; the label does not prove relationship quality, exclusivity, permanence, or desired outcome.

## Proposed tone table

| Ally relationship family | Example stored labels | Default V3 lens | Romantic or erotic material | Structure requirement | Safety boundary |
| --- | --- | --- | --- | --- | --- |
| Spouse or committed partner | spouse, husband, wife, partner | Adult romantic partnership | Allowed when supported by selected interaspects | Current eight-chapter romantic V3 may be used | Never infer monogamy, satisfaction, permanence, reconciliation, or stay/leave outcomes |
| Dating or explicitly romantic | dating, boyfriend, girlfriend, lover, romantic partner | Adult romantic connection | Allowed when supported by selected interaspects | Current romantic V3 may be used | Treat desire and commitment as separate questions; do not convert chemistry into consent or destiny |
| Friend or chosen family | friend, best friend, close friend, chosen family | Platonic connection by default | Allowed only when the report request explicitly selects a romantic lens; never inferred from the chart alone | Use neutral connection chapters unless the romantic lens is explicit | Preserve the friendship reading even when attraction contacts exist; do not declare hidden desire as fact |
| Child or descendant | child, son, daughter, stepchild, grandchild | Caregiving, attachment, development, and growing autonomy | Prohibited | Replace romantic chapters with attachment, caregiving, will and repair, care language, family roles, and the bond as a living system | No eroticization, partner-equivalence, burden assignment to the child, adult motive claims, or deterministic parenting verdicts |
| Parent or elder family | parent, mother, father, stepparent, grandparent | Family attachment, inheritance, care, authority, and individuation | Prohibited | Use family/lineage chapters rather than romantic chapters | Do not prescribe reconciliation, filial duty, estrangement, or care obligations |
| Sibling or peer family | sibling, brother, sister, cousin | Family bond, rivalry, loyalty, differentiation, and repair | Prohibited | Use family-system chapters | Do not sexualize intensity or turn conflict contacts into fixed family roles |
| Work or institutional relationship | colleague, coworker, manager, employee, client, business partner | Collaboration, communication, power, trust, and boundaries | Prohibited by default | Use work/collaboration chapters | Do not infer off-record romance, consent, loyalty, promotion, or professional outcomes |
| Mentor, guide, teacher, or advisor | mentor, coach, teacher, guide | Learning, authority, projection, boundaries, and growth | Prohibited by default | Use mentorship/power chapters | Name power asymmetry; do not romanticize dependency or authority |
| Unknown or uncategorized person | person, other, acquaintance, blank-like custom labels | Neutral human connection | Prohibited unless an explicit adult-romantic lens is selected | Use neutral connection chapters | When relationship meaning is unclear, ask or stay neutral rather than guessing |

## Recommended contract

Keep the authored `Ally.relationship` label for display, but derive or request a separate normalized report lens before generation. The minimum useful values are:

- `adult-romantic`
- `platonic`
- `family-caregiving`
- `family-peer`
- `professional`
- `mentorship`
- `neutral`

The report lens should control chapter vocabulary and prohibited inferences. It should not be guessed solely from astrological contacts. Child and family-caregiving modes require a distinct non-romantic structure before they are eligible for V3 testing.

## Review questions

1. Should `friend` default to platonic with an explicit romantic opt-in, as proposed?
2. Should spouse/partner automatically select `adult-romantic`, or should every report expose the lens choice?
3. Are the seven normalized lenses enough, or does parent/child need to be separated before implementation?

No production change is approved by this evaluation.

## Felicia + Tony strongest-15 sample

The private `felicia-tony` sample generated successfully from direct chart signals with the stored `spouse` context:

- 14 unique calculated interaspects plus the timed Moon comparison across 16 evidence slots;
- 4,061 words;
- all 14 interaspects visibly grounded;
- 73 Tony references, 75 Felicia references, and 18 relationship references;
- 11,097 total tokens, $0.090618, and 121.538 seconds;
- no saved-report input and no production or database write.

Steward judgment: **accept-with-notes as experiment evidence; hold as finished prose**. The architecture transferred and perspective balance was strong, but the output corrupted decimal degrees into degree-minute notation, treated `spouse` as evidence of marriage history and permanence, and drifted toward unequal-contribution claims. The private evidence is retained at `.astra-exports/dual-perspective-synastry-bakeoff/2026-07-31T17-20-44-172Z/`.
