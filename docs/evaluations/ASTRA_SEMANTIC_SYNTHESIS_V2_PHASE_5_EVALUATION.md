---
title: Astra Semantic Synthesis V2 Phase 5 Evaluation
status: complete
decision: HOLD
type: evaluation
project: Astra Clean Start
created: 2026-07-26
updated: 2026-07-27
source_revision: 9c7943609cbba9cbe01c6e57c2196477fb9bed2b
evaluation_version: 2.0.0-phase-5
---

# Astra Semantic Synthesis V2 Phase 5 Evaluation

## Decision

**HOLD.**

The deterministic architecture and independent repetition gate pass. The report-writing path improves materially but remains below the semantic and context-safety thresholds. Phase 6 heading and presentation work remains separate and was not started.

## Evaluated controls

Trusted charts:

- Tony Cecala — existing Phase 4 Deep control only; no Tony report was generated.
- Felicia Weiss — fresh V2 Core and Deep.
- Cheyenne Autumn — fresh V2 Core and Deep.
- Marissa Yahil — fresh V2 Core and Deep.
- Brandi McCulley — calculation-only structural control.
- Rachel Ijames — calculation-only structural control.

Brandi and Rachel were included because their deterministic structural fingerprints differ from Tony's and from each other. They prevent acceptance based only on charts structurally similar to Tony.

Calculation matrix for all six charts:

- Tropical + Whole Sign + full;
- Tropical + Placidus + full;
- Sidereal + Whole Sign + full;
- Sidereal + Placidus + full;
- Tropical + Whole Sign + signs-and-aspects-only.

Report controls used the production writer `anthropic/claude-sonnet-5`. Independent evaluation used `openai/gpt-5.6-terra` at temperature zero.

## Delivered evidence

The private packet is:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-26-phase-5-remediation-v9`

It contains:

- six fresh non-Tony V1/V2 Core or Deep report pairs;
- Tony's prior V1 and existing Phase 4 Deep report;
- selected complexes for every V2 report;
- chapter ownership and interpretive jobs;
- support paths and complete raw-fact provenance;
- retained counterevidence and qualifiers;
- omitted high-scoring candidates with omission reasons;
- five-mode trusted-chart fingerprints;
- deterministic results;
- independent semantic scores and rationales;
- independent cross-chapter repetition reviews;
- completed human review;
- the final HOLD decision.

## Hard-gate result

Passed:

- every retained Phase 0–4 deterministic gate;
- deterministic construction across all trusted charts and calculation modes;
- complete provenance for every meaning complex;
- independent support for every strong complex;
- no house, angle, cusp, or house-ruler leakage in signs-and-aspects-only controls;
- canonical Identity reuse between Core and Deep for each report control;
- distinct Core and Deep complex selections;
- exact ordinary-report fallback coverage;
- relationship context cannot change canonical Identity;
- all six generated non-Tony reports completed;
- zero Tony reports generated.

The accepted Marissa Core result required one additional orchestration attempt. The rejected attempt remains in private telemetry with its validator reasons.

The remediation also passed new deterministic fixtures for:

- chapter-local rather than report-global evidence authorization;
- compound natural-language aspect claims;
- exact direct-dispositor relationships;
- unsupported family, household, career, relationship, and defensive-history inference;
- categorical behavior, invented routines, recovery methods, and social effects;
- another person's inner state;
- unnecessary orb precision;
- status-to-condition, `structure: other`, and `open_to_connection` inference;
- report-level signal ownership and recurring astrological framing.

## Semantic thresholds

| Gate | Required | Observed | Result |
|---|---:|---:|---|
| Overall semantic average | 2.6/3 | 2.386/3 | Fail |
| No category below | 2/3 | Cheyenne Deep and Marissa Deep contain 1 scores | Fail |
| Context-safety average | 2.8/3 | 2.571/3 | Fail |
| Every Deep repetition score | 2/3 | 3, 2, 2, 2 | Pass |

Deep repetition:

- Felicia: 3/3.
- Cheyenne: 2/3.
- Marissa: 2/3.
- Tony: 2/3.

## Human review

### What works

- Felicia, Cheyenne, and Marissa Core are more focused and useful than their V1 controls.
- Meaning-complex selection creates real chart-specificity rather than generic chapter filler.
- Core and Deep use recognizably different evidence budgets.
- Reports generally retain counterweights, capacities, and practical conditions.
- Tone is usually calm, direct, and nonfatalistic.
- Chapter-local evidence authorization rejects facts borrowed from another chapter.
- Independent cross-chapter repetition passes for every Deep control.
- Deterministic evidence and provenance remain inspectable enough to diagnose every failure below.

### What blocks rollout

1. Deep evidence interpretation

   - Cheyenne Deep turns personal activation and Pluto-in-the-2nd evidence into current pressure, rapid certainty, and overhaul claims that exceed the packet.
   - Marissa Deep overstates a lunar-chain relationship, treats Neptune-Pluto as reliable group perception, and converts a counterweight into established self-correction.
   - Tony's fixed historical control still contains the known T-square geometry error; it was not regenerated.

2. Specificity and context safety

   - Hedged language still surrounds overly specific behavior in Cheyenne Deep and Marissa Deep.
   - A few relationship examples in Felicia Deep imply knowledge of a partner's needs or fears despite otherwise neutral framing.
   - Core is substantially safer, but occasional claims about how others respond still need a tighter qualitative boundary.

3. Deep ownership and importance

   - Cheyenne assigns Pluto in Scorpio in the 2nd house to both Blind Spots and Growth.
   - Marissa assigns Pluto in Scorpio in the 11th house twice and gives an exploratory lunar-phase complex more weight than stronger omitted candidates.
   - These repeats now pass the independent repetition floor because their conclusions differ, but they still weaken semantic importance and breadth.

## Rollout boundary

Keep V2 internal as a deterministic evidence engine. End this work at the completed Phase 5 HOLD evaluation. Do not begin heading or presentation changes from this packet.

## Phase 5.1 bounded Deep-quality refinement — 2026-07-27

Decision: **HOLD**.

The approved bounded refinement was implemented without changing Core, canonical Identity, headings, UI, routes, database contracts, public contracts, or any Phase 0–5 threshold.

### Implementation delivered

- Deep chapter ownership is now assigned deterministically across all eight non-Identity chapters under the seven-complex ceiling.
- A plan may repeat no more than one primary complex.
- Blind Spots and Growth cannot share a primary complex.
- A repeated primary requires different domain-matching evidence origins and applications.
- Supported evidence is preferred to exploratory evidence when scores are reasonably close, with stable identifier ordering for ties.
- Claim boundaries now distinguish natal relevance from current activation, keep slow planets from proving rapid certainty or accurate social perception, preserve rulership paths as rulership paths, and prevent counterevidence from proving an existing skill or habit.
- Deterministic validators now cover implied current activation, invented aspect chains, privileged social perception, categorical certainty or change, and established self-correction.
- Tony remains fully scored as a historical benchmark but is excluded from current-generation rollout thresholds.
- The private runner can reuse the completed packet while regenerating Deep reports for an explicit non-Tony subject subset.

### Bounded packet

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10`

Only Felicia, Cheyenne, and Marissa Deep were scheduled for regeneration. Tony reports generated: **0**.

### Gate results

| Gate | Required | Observed | Result |
|---|---:|---:|---|
| Deterministic and calculation gates | All pass | Cheyenne Deep failed generation | Fail |
| Overall candidate semantic average | 2.6/3 | 2.22/3 | Fail |
| No candidate category below | 2/3 | Multiple 1 scores | Fail |
| Candidate context-safety average | 2.8/3 | 2.4/3 | Fail |
| Every current Deep repetition score | 2/3 | Felicia 1/3; Marissa 2/3 | Fail |
| Human review | Every new Deep materially better than V1 | None of the three met the requirement | Fail |

### Human findings

- The assignment planner met its structural requirements for all three Deep plans.
- Felicia Deep remained unsafe around inferred social perception and another person's inner state, and repeated the same effort-calibration conclusion.
- Cheyenne Deep exhausted three unchanged attempts. The validators repeatedly rejected generic dispositor-chain narration; one attempt also made a categorical-change claim. No accepted nine-chapter report was produced.
- Marissa Deep was context-safe, but Gifts incorrectly rewrote a Pluto-to-Mars dispositor relation as a square and the report repeated its Pisces-Moon communication and Aquarius-resource themes.
- Tony remained a separately reported historical control and did not affect current-candidate threshold calculations.

### Stop condition

The bounded plan required a HOLD when any gate failed. No further refinement and no heading or presentation work began.

## Targeted blocker repair: Marissa Gifts invented aspect — 2026-07-27

Blocker decision: **PASS**.

Scope was limited to the Marissa Deep Gifts chapter. No complete Deep report or other subject was generated.

### Root cause

`mechanismForPath` assigned `aspect_*` whenever any node traversed by an evidence path was an aspect, even when the terminal evidence node was a `RulershipPath`. Marissa's Gifts card therefore supplied:

`pluto disposed by mars; aspect square`

The writer followed the malformed evidence and rendered Pluto's dispositor relationship as a square.

### Repair

- Terminal structural nodes now retain their own mechanism before a traversed aspect is considered.
- Marissa's targeted Gifts evidence now supplies `pluto disposed by mars; rulership dispositor`.
- The Phase 3 invariant requires every path ending at a `RulershipPath` to retain a `rulership_*` mechanism.
- The Phase 5 deterministic evaluator now rejects the exact failure class: `Pluto is disposed by Mars, a square aspect.`
- Production chapter validation and evaluator validation use the same new rejected-prose rule.

### Targeted generation

Private evidence:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10/blockers/marissa-gifts-invented-aspect`

- Attempts: 1.
- Model spend: $0.010164.
- Invented aspect: pass.
- Unsupported biography: pass.
- Categorical behavior: pass.
- Complete Deep reports generated: 0.
- Other subjects generated: 0.

The blocker is resolved. Inspection also found a separate house-ruler wording defect in the selected evidence (`House 5 ruler venus in 5th house`) and unnecessary orb detail in the targeted prose. Those are explicitly outside this blocker and remain unresolved; no additional remediation was started.

## Targeted blocker repair: Marissa Gifts house-ruler placement — 2026-07-27

Blocker decision: **PASS**.

Scope was limited to the Marissa Deep Gifts evidence and chapter. No complete
Deep report or other subject was generated. Orb wording was not changed or
evaluated.

### Root cause

The shared evidence serializer treated every numeric `attributes.house` value
as a placement house. That assumption is false for a house-ruler
`RulershipPath`: `house` identifies the house being ruled, while `rulerHouse`
stores the ruler planet's actual natal placement.

The malformed evidence was:

`House 5 ruler venus; 5th house; House 5 ruler venus in 5th house; rulership house ruler`

Although the graph correctly stored Venus in the second house, the serializer
discarded that distinction and gave the writer a false fifth-house placement.

### Repair

- House-ruler evidence now states the two facts independently: the planet rules
  the specified house, and the planet occupies its actual natal house.
- Marissa's corrected evidence is:
  `House 5 ruler venus; Venus rules 5th house; Venus in 2nd house; rulership house ruler`.
- A deterministic fixture proves that Mars can rule Tony's fifth house while
  retaining its second-house natal placement, and explicitly rejects
  `House 5 ruler mars in 5th house`.
- Other evidence-node types retain their existing placement serialization.

### Targeted generation

Private evidence:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10/blockers/marissa-gifts-house-ruler-placement`

- Attempts: 1.
- Model spend: $0.012882.
- House ruled and actual ruler placement kept distinct: pass.
- Ruled house rewritten as placement: no.
- Unsupported biography: none.
- Categorical behavior: none.
- Complete Deep reports generated: 0.
- Other subjects generated: 0.

The single Gifts chapter accurately says Venus is in the second house and rules
the fifth house. This blocker is resolved. The overall Phase 5.1 packet remains
HOLD; no other blocker or presentation work was started.

## Targeted blocker repair: Marissa Gifts unnecessary orb wording — 2026-07-27

Blocker decision: **PASS**.

Scope was limited to Marissa's Deep Gifts evidence and chapter. No complete Deep
report or other subject was generated.

### Root cause

The meaning-complex graph correctly retained the Uranus-Neptune conjunction and
its orb for internal calculation and importance scoring. The shared V2 prose
serializer also copied that orb into the selected evidence packet:

`uranus conjunction neptune; orb 1.319 degrees; aspect conjunction`

Production generation guidance discouraged orb narration, but the earlier
targeted Gifts harness did not include that instruction. The writer therefore
received and repeated editorial precision that the chapter did not need.

### Repair

- V2 writer-facing evidence no longer serializes orb measurements.
- Aspect identity and mechanism remain available. Marissa's corrected evidence
  is `uranus conjunction neptune; aspect conjunction`.
- Internal chart calculations, orb-based selection, and valid aspect evidence
  remain unchanged.
- Production guidance now requires a plain aspect statement without measurement
  or a defensive disclaimer about tightness, exactness, intensity, or precision.
- The production validator and deterministic evaluator reject both numeric orb
  prose and disclaimer-style orb narration.
- The Phase 4 fixture proves that a selected aspect and its mechanism survive
  while the prose packet contains no orb or degree measurement.
- The Phase 5 fixture rejects: `Uranus conjunct Neptune is present, without any
  claim about its intensity or precision.`

### Targeted generation

Private evidence:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10/blockers/marissa-gifts-orb-wording`

- Five recorded model attempts.
- Accepted recorded attempt: 5.
- Known model spend: $0.048644.
- One additional provider call was interrupted by a local aspect-regex capture
  error before its usage telemetry was persisted; its cost is unavailable.
- Selected Uranus-Neptune conjunction retained in evidence and prose: pass.
- Orb measurement and precision disclaimer absent from evidence and prose: pass.
- Complete Deep reports generated: 0.
- Other subjects generated: 0.

The blocker is resolved. The overall Phase 5.1 packet remains HOLD. No other
semantic blocker, heading, or presentation work was started.

## Targeted blocker repair: Marissa Gifts generic dispositor-chain narration — 2026-07-27

Blocker decision: **PASS**.

Scope was limited to Marissa's Deep Gifts evidence and chapter. No complete Deep
report or other subject was generated.

### Root cause

The writer-facing packet included a generic aggregate node:

`dispositor-chain:venus; rulership dispositor-chain`

The node did not state an exact directional relationship, while the same packet
already contained the usable direct facts:

- `House 5 ruler venus; Venus rules 5th house; Venus in 2nd house; rulership house ruler`
- `pluto disposed by mars; rulership dispositor`

The aggregate node invited a general explanation of how a dispositor chain
works, even though the product contract requires prose to stay with exact
selected relationships.

### Repair

- Writer-facing V2 evidence now omits only `RulershipPath` nodes whose
  `pathType` is `dispositor-chain`.
- Direct house-ruler, dispositor, final-dispositor, loop, and mutual-reception
  facts remain available.
- Production validation rejects singular or plural generic
  `dispositor chain` narration.
- The deterministic evaluator applies the same hard gate.
- The rejected-prose fixture is:
  `The dispositor chain shows how planets hand off their expression through sign rulership.`

### Targeted generation

Private evidence:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10/blockers/marissa-gifts-dispositor-chain`

- Recorded attempts: 2.
- Accepted attempt: 2.
- Model spend: $0.017412.
- Exact direct rulership facts retained in evidence and prose: pass.
- Generic aggregate chain evidence omitted: pass.
- Generic dispositor-chain narration omitted: pass.
- Complete Deep reports generated: 0.
- Other subjects generated: 0.

This blocker is resolved. The overall Phase 5.1 packet remains HOLD. No other
semantic blocker, heading, or presentation work was started.

## Targeted blocker repair: Marissa Relationships lunar-chain overreach — 2026-07-27

Blocker decision: **PASS**.

Scope was limited to Marissa's Deep Relationships evidence and chapter. No
complete Deep report or other subject was generated.

### Root cause

The current writer-facing evidence already omits aggregate
`dispositor-chain:*` nodes, but production and deterministic validation only
rejected the literal phrase `dispositor chain`. The failed Phase 5.1 sentence:

`The chain tracing back to Chiron suggests this reciprocity pattern is not automatic or fully settled.`

therefore passed despite converting an opaque aggregate chain into a
qualitative relational conclusion.

### Repair

- Generic-chain validation now also rejects rulership/dispositor sequences and
  chain language that traces, leads, runs, or ends at a named chart body.
- The validator was preflighted against the exact failed sentence and two
  invalid paraphrases.
- The same preflight preserves valid direct statements such as `The Moon is
  disposed by Jupiter`, `Jupiter is the Moon's dispositor`, and `Saturn is the
  final dispositor`.
- A deterministic rejected-prose fixture covers the exact Marissa sentence.

### Current evidence

The current Relationships card contains:

- Moon in Pisces in the 3rd house;
- Moon rules the 7th house while remaining placed in the 3rd;
- Chiron has natal relevance only;
- Jupiter is disposed by Mercury.

It contains no aggregate dispositor-chain evidence. The targeted writer used
that current packet rather than restoring the obsolete Moon-to-Jupiter signal
from the original full-report control.

### Targeted generation

Private evidence:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10/blockers/marissa-relationships-lunar-chain`

- Recorded attempts: 2.
- Accepted attempt: 2.
- Model spend: $0.014808.
- Attempt 1 was rejected during human evidence review for invoking unspecified
  `placements elsewhere`.
- Attempt 2 contains no chain narration, unsupported biography, categorical
  behavior, another-person inner-state claim, or unselected evidence from
  elsewhere in the chart.
- Complete Deep reports generated: 0.
- Other subjects generated: 0.

This blocker is resolved. The overall Phase 5.1 packet remains HOLD. The
remediation goal was subsequently narrowed to stop after the current repair so
the 4,562-line astrology entry module can receive a separate architecture pass;
no additional semantic blocker is authorized by this packet.

## Targeted blocker repair: Marissa Blind Spots privileged perception — 2026-07-27

Blocker decision: **PASS**.

Scope was limited to Marissa's Deep Blind Spots evidence and chapter. No
complete Deep report or other subject was generated.

### Root cause

The slow-planet claim boundary correctly prohibited accurate social perception
and rapid certainty, but three implementation details kept reproducing the
failure:

- validation recognized `sharpens your read of hidden group undercurrents` but
  missed `shape how you read a room`, `first impression feels complete`, and
  `feeling of knowing arrives fast`;
- validation treated explicit negations of those claims as affirmative claims;
- writer guidance repeated the prohibited phrases and named the Blind Spots job
  as `perception`, causing the model to write entire rebuttal chapters around
  the forbidden frame.

### Repair

- Privileged-perception validation now covers the exact Phase 5.1 wording.
- Clause-level validation distinguishes affirmative claims from explicit
  negation while continuing to inspect assertions after `but` or `yet`.
- Deterministic preflight rejects the exact failure and preserves five bounded
  or explicitly negated paraphrases.
- The writer-facing slow-planet boundary now gives constructive scope:
  symbolic importance, conditional claims, and observable information.
- Blind Spots now owns `counterevidence, verification, and the limits of a
  first interpretation`.
- Targeted retry guidance no longer repeats the forbidden semantic frame.

### Targeted generation

Private evidence:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10/blockers/marissa-blind-spots-privileged-perception`

- Recorded attempts: 7.
- Accepted attempt: 7.
- Model spend: $0.055314.
- Attempts 1–4 exposed negation false positives and prompt fixation.
- Attempt 5 was rejected for invoking unselected evidence from elsewhere in
  the chart.
- Attempt 6 still circled the forbidden perception frame.
- Attempt 7 develops symbolic weight versus observable information without
  privileged perception, rapid certainty, invented timing, biography,
  categorical behavior, another-person inner state, or unselected evidence.
- Complete Deep reports generated: 0.
- Other subjects generated: 0.

This blocker is resolved. The overall Phase 5.1 packet remains HOLD while the
remaining documented semantic blockers are handled one at a time.

## Targeted blocker repair: Marissa Gifts personal-activation overreach — 2026-07-27

Blocker decision: **PASS**.

Scope was limited to Marissa's Deep Gifts evidence and chapter. No complete Deep
report or other subject was generated.

### Root cause

The selected evidence exposed:

`uranus personal activation; personal activation`

It identified the structural fact but did not tell the writer that personal
activation authorizes only natal relevance. The prior targeted chapter therefore
expanded it into unpredictability, inspiration, clarification, and
destabilization.

### Repair

- Writer-facing personal-activation evidence now includes the bounded meaning:
  `Uranus has natal relevance; natal relevance only`.
- The PersonalActivation graph node, personalized status, and selection weight
  remain unchanged.
- Production validation rejects activation-based claims of unpredictability,
  inspiration, clarification, destabilization, current timing, or behavior.
- The deterministic evaluator applies the same hard gate.
- The rejected-prose fixture is:
  `Uranus carries personal activation in this chart. This suggests
  unpredictability or inspiration that can clarify or destabilize the Venus
  pattern.`

### Targeted generation

Private evidence:

`.astra-exports/semantic-synthesis-v2-phase-5/2026-07-27-phase-5-remediation-v10/blockers/marissa-gifts-personal-activation`

- Recorded attempts: 6.
- Accepted attempt: 5.
- Model spend: $0.047678.
- Uranus personal activation retained as natal relevance in evidence and prose:
  pass.
- Unsupported activation qualities, effects, timing, and behavior: absent.
- Complete Deep reports generated: 0.
- Other subjects generated: 0.

This blocker is resolved. The overall Phase 5.1 packet remains HOLD. No other
semantic blocker, heading, or presentation work was started.

## Scope stop — 2026-07-27

The prior goal to attempt six sequential blocker repairs is retired. Work stops
with the completed targeted repairs recorded above. The next effort is a
separate, behavior-preserving architecture pass over
`packages/astrology/src/index.ts`; it must not silently resume semantic
remediation or report generation.
