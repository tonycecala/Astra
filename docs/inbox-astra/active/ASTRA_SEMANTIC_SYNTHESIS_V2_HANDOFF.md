---
title: Astra Semantic Synthesis V2 Implementation Handoff
status: active
type: implementation-handoff
project: Astra Clean Start
author: Tony + Codex
created: 2026-07-26
updated: 2026-07-26
priority: P0
audience: Codex / engineering agents
mission: Make Astra materially smarter astrologically by deriving and synthesizing professional-grade chart signals before revising report headings.
phase_0_status: complete
phase_1_status: complete
phase_2_status: complete
next_phase: Phase 3
supersedes: ../ASTRA_WEIGHTED_CHART_SIGNAL_GRAPH_TODO.md
depends_on:
  - ../../decisions/ASTRA_CHART_LOCATION_INTEGRITY_AND_SIGNAL_GRAPH.md
  - ../../decisions/ASTRA_SEMANTIC_SYNTHESIS_V1.md
---

# Astra Semantic Synthesis V2

## Goal

Build the first complete version of Astra that reasons across a natal chart as a connected astrological system.

V1 improved evidence ownership, claim boundaries, context safety, canonical Identity, and prose generation. V2 must improve the astrological intelligence underneath those controls. It must recognize important signals Astra currently omits or underuses, derive configurations such as chart rulers, dispositors, house-ruler pathways, stellia, T-squares, Grand Trines, Grand Crosses, and Yods, and combine independent evidence into inspectable meaning complexes with support, counterevidence, confidence, and provenance.

The primary success criterion is not prettier prose. It is that a skilled astrologer can inspect Astra's selected themes and say:

> Astra found the important structures, understood how they qualify one another, and can show why this interpretation belongs to this chart.

New report headings are a secondary presentation improvement. Do not begin heading redesign until the new signal engine passes its astrological and semantic gates.

## Product Outcome

V2 should move Astra from:

> select several high-priority placements and aspects, assign them to chapters, and ask the model to connect them

to:

> calculate a trustworthy chart, derive its important structural relationships, form a small number of supported and qualified interpretive hypotheses, and render distinct views of those meaning complexes for Identity, Core, and Deep.

The language model remains the prose writer. It must not be responsible for discovering chart geometry, inventing missing astrological rules, deciding whether a pattern exists, or manufacturing counterevidence.

## Non-Negotiable Priority Order

### P0 — Expand trustworthy astrological signals

Calculate and expose the missing chart facts and derived relationships that materially change interpretation.

### P0 — Build connected meaning complexes

Combine independent signals into supported hypotheses with counterweights, confidence, claim boundaries, and full provenance.

### P1 — Integrate V2 with the existing report path

Feed meaning complexes into the existing signal-card and section-generation architecture while preserving canonical Identity, ordinary fallbacks, relationship-context safety, and current hard gates.

### P1 — Prove astrological and semantic quality

Use deterministic geometry tests, synthetic pattern charts, trusted real charts, semantic repetition checks, report comparison, and human review.

### P2 — Reconsider chapter headings and order

Only after the engine is producing better meaning should headings be revised to reveal that meaning more naturally.

Do not reverse this order. Renaming chapters cannot compensate for shallow chart reasoning.

## Current Baseline

Semantic Synthesis V1 already provides:

- optional `hypothesis`, `counterweight`, and `claimBoundary` fields on enriched section cards;
- role-based evidence ownership rather than Tony-specific named-aspect rules;
- one canonical Identity reused across contexts and tiers;
- sectioned generation for enriched Core and Deep reports;
- conditional safety language for strained or ending relationship contexts;
- bounded Gifts language;
- ordinary-report fallbacks;
- cross-chapter semantic repetition evaluation.

Preserve those gains.

The current chart path still relies mostly on placements, houses when birth data supports them, and a small set of major aspects ranked largely by orb. It does not yet create a sufficiently rich internal model of chart structure. Configuration, rulership, hierarchy, repeated independent support, and contradictory testimony are largely left to prompts or omitted.

## Interpretive Doctrine Before Code

Astrological software becomes incoherent when it silently mixes incompatible schools. Before implementing derived rules, add one short accepted decision document that fixes V2's interpretive doctrine.

The recommended V2 doctrine is:

- Tropical or Sidereal remains a user-selected calculation basis.
- Whole Sign or Placidus remains a user-selected house basis.
- Modern psychological natal interpretation is the report voice.
- Traditional rulership supplies the primary structural ruler graph.
- Modern outer-planet rulership may be retained as a labeled secondary affinity, never as an invisible replacement for the traditional ruler.
- Aspects and configurations are calculated geometrically, not inferred by the model.
- Dignity, reception, sect, and other traditional testimony may qualify a hypothesis, but must not turn the report into fortune-telling or moral ranking.
- Chiron, the lunar nodes, and outer planets require appropriate personal activation before supporting strong biographical claims.
- No interpretive rule may enter production without an identifier, definition, confidence tier, provenance, and deterministic tests.

If product ownership chooses a different doctrine, record it explicitly. Do not let individual implementation functions choose their own astrology.

## Signal Inventory

### Tier A — Required for V2

These signals produce the largest immediate increase in astrological intelligence and should ship together.

#### Angles and angular emphasis

- Ascendant, Midheaven, Descendant, and IC as first-class chart factors for `full` charts.
- Planet conjunctions to angles with explicit allowable orbs.
- Angular, succedent, and cadent house classification.
- Cusp proximity rules where the selected house system makes them meaningful.
- No angle, house, or cusp evidence in `signs-aspects-only` mode.

#### Lunar nodes

- North Node and South Node as an explicit pair.
- One documented calculation policy: true node or mean node.
- Node sign and house when eligible.
- Tight conjunctions and oppositions from planets and angles.
- Node ruler and dispositor pathways.
- Nodes support developmental direction and familiar tendencies; they do not prove fate, past lives, or categorical biography.

#### Rulership network

- Chart ruler from the Ascendant for `full` charts.
- Traditional sign rulers as primary structural rulers.
- House rulers and ruler-of-house-in-house pathways.
- Planetary dispositors.
- Final dispositor when one exists.
- Mutual reception.
- Dispositor loops and chains.
- Modern rulership affinities retained separately when useful.
- Every derived ruler path must cite its original placement and calculation basis.

#### Aspect completeness and hierarchy

- Conjunction, opposition, square, trine, sextile, and quincunx.
- Aspect-specific allowable orbs.
- Tighter treatment for pattern geometry than for ordinary interpretive aspects.
- Applying versus separating where calculation data supports it.
- Luminary, personal-planet, angle, chart-ruler, and node involvement.
- Personal-planet connection as the main test for whether an outer-planet aspect becomes personally salient.
- No duplicated importance when the same aspect supports several derived labels.

#### Major configurations

- Conjunction clusters.
- Stellia, using one documented definition.
- T-square.
- Grand Cross.
- Grand Trine.
- Kite.
- Yod, requiring two quincunxes to one apex plus a sextile between the base planets.
- Mystic Rectangle.
- Configuration participants, apex or focal planet where applicable, signs, houses when eligible, aspect orbs, and geometric confidence.
- A configuration must never be declared from semantic similarity; its geometry must pass deterministic rules.

#### Chart-wide distributions

- Element emphasis and relative absence.
- Modality emphasis and relative absence.
- Polarity balance.
- Hemisphere emphasis.
- Quadrant emphasis.
- House-mode emphasis: angular, succedent, cadent.
- Concentration should qualify interpretation; absence must not be described as a missing human capacity.

#### Solar-lunar structure

- Sun–Moon aspect.
- Lunar phase.
- Luminary rulers and dispositors.
- Independent reinforcement or tension between conscious orientation and emotional processing.

#### Personalization of slower factors

- Outer planets gain personal weight through tight contact with luminaries, personal planets, angles, nodes, or the chart ruler.
- Chiron gains personal weight through comparable direct activation.
- Unpersonalized generational placements may supply context but cannot anchor categorical personality claims.

#### Retrogradation

- Natal retrograde state as a qualifier, not a diagnosis.
- Retrograde meaning is attached to the planet's existing role and rulership network.
- Do not equate retrograde with weakness, delay, trauma, or an inward personality without supporting evidence.

### Tier B — Add after the Tier A engine is stable

These are valuable professional techniques, but should not delay the first complete V2.

- Essential dignity and debility.
- Accidental dignity.
- Reception and mutual reception beyond the basic ruler graph.
- Sect and day/night chart distinctions.
- Planetary joy by house.
- Combustion, cazimi, and under-the-beams conditions.
- Oriental/occidental relationship to the Sun.
- Out-of-bounds planets and declination parallels/contra-parallels.
- Interceptions and duplicated signs for quadrant houses.
- Chart shape families such as bundle, bowl, bucket, locomotive, splash, and seesaw.
- Prenatal lunation and nodal phase relationships.

Each Tier B technique needs a separate product judgment about whether it clarifies a modern Astra report or merely displays technical sophistication.

### Tier C — Explicitly deferred

Do not put these into the initial V2 implementation:

- large asteroid catalogs;
- fixed stars;
- Arabic Parts beyond a separately approved Part of Fortune treatment;
- midpoints;
- harmonics;
- antiscia and contra-antiscia;
- hypothetical planets;
- degree symbols;
- transits, progressions, directions, or timing;
- synastry or composite-chart rules.

They may become later programs. V2 should first master the natal chart structures already listed.

## Typed Semantic Model

Implement the network in memory inside the existing astrology package. Do not add a graph database, graph service, embeddings, registry service, new route, or customer-facing technical controls.

### Node types

- `Planet`
- `Luminary`
- `Angle`
- `LunarNode`
- `Sign`
- `House`
- `HouseCusp`
- `Aspect`
- `Configuration`
- `Distribution`
- `RulershipPath`
- `LifeDomain`
- `InterpretiveHypothesis`

### Edge types

- `located_in_sign`
- `located_in_house`
- `rules_sign`
- `rules_house`
- `disposes`
- `modern_affinity`
- `aspects`
- `conjunct_angle`
- `near_cusp`
- `participates_in_configuration`
- `routes_domain_to`
- `reinforces`
- `qualifies`
- `contradicts`
- `derived_from`

### Required provenance

Every node, edge, configuration, and hypothesis must retain:

- stable rule identifier;
- source chart fact identifiers;
- zodiac and house-system basis;
- calculation mode;
- measured longitude, distance, or orb where relevant;
- derivation path;
- confidence tier;
- reasons for inclusion;
- reasons for any confidence reduction.

The provenance format should be inspectable in tests and internal debug output. It does not require a database migration or customer UI in the first V2 slice.

## Meaning Complexes

A meaning complex is a connected, report-worthy interpretive hypothesis supported by more than a single isolated label.

Each complex must include:

```ts
type MeaningComplex = {
  id: string;
  hypothesis: string;
  domains: ReportDomain[];
  supportPaths: EvidencePath[];
  counterevidence: EvidencePath[];
  qualifiers: string[];
  confidence: "exploratory" | "supported" | "strong";
  claimBoundary: string;
  provenance: ProvenanceReference[];
  preferredView: "identity" | "core" | "deep" | "all";
};
```

The exact internal names may follow existing repository conventions. The behavior is mandatory.

### Formation rules

1. Seed candidate complexes from structurally important factors:
   - luminaries;
   - chart ruler;
   - angles;
   - angular planets;
   - personal planets;
   - configuration focal planets;
   - strongly personalized outer planets or Chiron;
   - nodal contacts.
2. Expand only through typed, astrologically valid paths.
3. Limit ordinary expansion to short paths so remote associations do not become fake certainty.
4. Group paths by a shared mechanism or life domain, not by repeated keywords.
5. Require independent support for `strong` confidence.
6. Collapse derived labels that originate from the same raw fact so they count once.
7. Seek relevant counterevidence from genuinely different chart structures.
8. Lower confidence when evidence is mostly generational, remote, contradictory, or dependent on uncertain birth data.
9. Preserve tensions when both sides are well supported. Do not force every chart into one clean thesis.
10. Create claim boundaries before prose generation.

### Scoring dimensions

Use transparent component scores, not one unexplained magic number:

- structural importance;
- aspect precision;
- angularity;
- chart-ruler relevance;
- luminary or personal-planet relevance;
- configuration role;
- independent reinforcement;
- life-domain relevance;
- contextual activation;
- counterevidence strength;
- generational weakness;
- derivation distance;
- semantic redundancy.

Store the components so an astrologer or engineer can challenge the result.

## Contextual Activation

Relationship context, report tier, and requested focus may change which meaning complexes are foregrounded. They must not alter natal geometry or manufacture new natal facts.

- `single`, `partnered`, `separated`, and other status values select applications, not personality.
- condition values such as `strained` or `ending` affect safety framing and contextual application.
- structure values never imply unprovided arrangements.
- intention values such as `open_to_connection` never prove dating behavior, desire, or biography.
- canonical Identity remains stable across these contexts.
- another person's motives, feelings, or inner state remain outside the natal evidence boundary.

## Canonical Identity, Core, and Deep

### Canonical Identity

Identity is generated once from the most identity-relevant meaning complexes and reused.

It should synthesize:

- luminaries;
- Ascendant and chart ruler when eligible;
- the dominant ruler/dispositor structure;
- the most important identity configuration;
- one meaningful counterweight;
- the boundaries of what the chart cannot establish.

Relationship context must not regenerate the person.

### Core

Core should use the strongest three or four meaning complexes and remain clear, stable, and economical.

- one primary complex per chapter;
- only the supporting evidence needed for that chapter;
- a canonical Identity bridge rather than repeated Identity evidence;
- practical implications without turning every chapter into correction;
- no technical catalog of configurations.

Core proves that the new engine can create more specific synthesis without creating a denser report.

### Deep

Deep should use approximately five to seven meaning complexes, including secondary expressions and genuine contradictions.

- show how a complex changes across domains;
- distinguish a shared root mechanism from repeated conclusions;
- include counterevidence and stabilizing resources;
- allow a configuration or rulership pathway to organize more than one observation without repeating its full interpretation;
- make every chapter add a new angle, consequence, capacity, or application;
- retain the existing cross-chapter semantic repetition gate.

Deep must feel broader and more dimensional than Core, not merely longer or more corrective.

## Report Heading Work — Secondary

Do not change headings during the signal-engine phases unless a temporary internal label is required for tests.

After the V2 reports pass their astrological and semantic gates, evaluate a hybrid heading system:

- stable functional chapter names for navigation;
- optional chart-specific subtitles derived from the meaning complex;
- canonical Identity first;
- predictable Core order;
- flexible Deep order after Identity when the strongest chart structures warrant it.

Candidate functional headings:

- Core Orientation
- Emotional Processing
- Connection & Reciprocity
- Work, Value & Contribution
- Agency & Momentum
- Capacities & Resources
- Perception & Distortion
- Developmental Arc
- Operating Principles

These names are hypotheses, not an approved UI change. Test whether they clarify the new synthesis before replacing the current headings. Do not create heading variety merely to make reports look different.

## Implementation Sequence

### Phase 0 — Lock doctrine and inventory the current engine

Deliver:

- accepted V2 interpretive-doctrine decision;
- a table mapping every required Tier A signal to current support: complete, partial, absent, or blocked by calculation provenance;
- exact calculation-library capabilities and gaps;
- a bounded implementation map inside the existing astrology package.

Gate:

- no ambiguous rulership, node, orb, stellium, or configuration policy remains.

### Phase 1 — Normalize first-class chart facts

Deliver:

- first-class angles;
- lunar nodes;
- complete supported aspect set including quincunx;
- retrograde state;
- angularity and house-mode classification;
- aspect metadata required for applying/separating and configuration geometry;
- provenance-safe omission in `signs-aspects-only`.

Gate:

- deterministic fixtures prove the normalized facts independently of report generation.

### Phase 2 — Derive structural astrology

Deliver:

- chart ruler;
- house rulers;
- dispositors, chains, loops, final dispositors, and mutual reception;
- angular contacts and cusp proximity;
- configurations;
- distributions;
- lunar phase;
- personal activation of outer planets, Chiron, and nodes.

Gate:

- synthetic charts designed for each rule produce the expected structure;
- near-miss charts do not produce false configurations;
- every derived structure links back to raw facts.

### Phase 3 — Build the meaning-complex engine

Deliver:

- typed in-memory network;
- evidence-path expansion;
- independent-support counting;
- duplicate-origin collapse;
- counterevidence selection;
- transparent component scoring;
- confidence and claim-boundary derivation;
- inspectable meaning-complex output.

Gate:

- the same chart and settings are deterministic;
- one raw fact cannot inflate confidence through multiple aliases;
- contradictory evidence qualifies rather than disappears;
- unpersonalized generational evidence cannot anchor a strong complex.

### Phase 4 — Integrate report views

Deliver:

- canonical Identity selection from meaning complexes;
- distinct Core and Deep selections;
- adaptation into the existing enriched-card path;
- preservation of ordinary report fallbacks;
- no new database contract, API route, package, or UI dependency unless a demonstrated blocker is separately approved.

Gate:

- existing V1 behavior remains intact for reports that do not receive V2 complexes;
- Core and Deep use the same chart truth but provide materially different depth;
- context changes application without changing Identity.

### Phase 5 — Evaluation and internal rollout

Deliver:

- deterministic test suite;
- synthetic geometry suite;
- trusted-chart control suite;
- before-and-after Core and Deep reports;
- evaluator packet;
- human-review packet with provenance;
- explicit GO, HOLD, or NO-GO decision.

Gate:

- all hard gates and semantic thresholds pass before widening internal use.

### Phase 6 — Headings and presentation

Only after Phase 5 passes:

- test functional headings and meaning-complex subtitles;
- test fixed versus flexible Deep ordering;
- compare comprehension, orientation, repetition, and perceived specificity;
- make one product recommendation;
- treat any customer-facing change as a separate approved implementation.

## Code Boundaries

Prefer internal modules within the existing astrology package if the implementation would otherwise make the current file harder to reason about. Reasonable internal boundaries include:

- normalized chart facts;
- rulership derivation;
- configuration detection;
- distribution analysis;
- semantic network construction;
- meaning-complex formation;
- report-view selection.

Do not add:

- a new package;
- graph database;
- network service;
- embeddings or vector search;
- external rule registry;
- database changes;
- public contract changes;
- routes;
- customer UI;
- LLM-based chart calculation;
- prose correction passes that compensate for overbroad evidence.

The model should receive less, better-organized evidence. Do not hand it the full graph and ask it to discover the report.

## Test Strategy

### Deterministic unit fixtures

Create synthetic charts with exact longitudes for:

- each supported aspect and an outside-orb near miss;
- applying and separating cases;
- angle conjunction and outside-orb cases;
- each dispositor-chain shape;
- final dispositor;
- mutual reception;
- stellium and near-stellium;
- T-square and near-T-square;
- Grand Cross;
- Grand Trine;
- Kite;
- Yod and near-Yod;
- Mystic Rectangle;
- element, modality, polarity, hemisphere, and quadrant concentrations;
- nodal activation;
- personalized and unpersonalized outer-planet cases.

### Trusted real-chart controls

Use:

- Tony;
- Felicia;
- Cheyenne;
- Marissa.

These are regression and interpretive-review controls, not targets to tune by name.

Add at least two charts selected specifically because their structures differ from Tony's. No rule may be accepted solely because it improves Tony.

### Calculation-mode matrix

For eligible fixtures, compare:

- Tropical and Sidereal;
- Whole Sign and Placidus;
- `full` and `signs-aspects-only`.

Expected changes must change evidence. Reduced calculation modes must never leak houses, angles, cusps, or house rulers.

### Semantic evaluator

Retain and extend the current evaluator to cover:

- unsupported biography;
- categorical behavior;
- another person's inner state;
- context leakage;
- structure and intention overreach;
- claim-boundary violations;
- repeated mechanisms and repeated conclusions across chapters;
- duplicate evidence inflation;
- missing counterevidence for high-confidence complexes;
- provenance gaps;
- Core/Deep collapse into equivalent views;
- technical astrology dumped into prose without interpretation.

Do not use a shallow unique-word or unique-insight count as the primary repetition metric.

### Human review

For every control report, reviewers should see:

- the report;
- the selected meaning complexes;
- support paths;
- counterevidence;
- omitted high-scoring candidates and why they were omitted;
- the prior V1 report;
- a short rubric.

Review for:

- astrological correctness;
- importance of selected structures;
- genuine synthesis;
- specificity without invented biography;
- dimensionality;
- tone;
- usefulness;
- Core/Deep distinction;
- semantic repetition.

## Hard Gates

V2 cannot expand beyond internal testing unless all are true:

- every declared configuration passes deterministic geometry;
- every meaning complex has complete provenance;
- no signs-only result contains house, angle, cusp, or house-ruler evidence;
- no context value invents relationship structure, intention, recency, biography, or another person's inner state;
- strong complexes have independent support rather than duplicated derivations;
- unpersonalized generational evidence does not anchor strong claims;
- counterevidence is retained when materially relevant;
- canonical Identity remains stable across contexts and tiers;
- Core and Deep are recognizably distinct views;
- semantic repetition stays within the existing accepted threshold;
- ordinary-report fallbacks pass;
- human review finds the new reports materially more astrologically insightful than V1.

Passing prose style checks without passing the astrological gates is a failure.

## Definition of Done

V2 is complete when:

1. Tier A signals are calculated or derived deterministically with documented rules.
2. The in-memory semantic network connects chart facts without new infrastructure.
3. Meaning complexes contain support, counterevidence, confidence, claim boundaries, and provenance.
4. Canonical Identity, Core, and Deep consume distinct views of the same chart truth.
5. Existing fallbacks and relationship-context safeguards remain intact.
6. Synthetic and real-chart tests pass across the calculation-mode matrix.
7. Human reviewers can inspect why Astra selected each major theme.
8. Human review judges V2 materially smarter astrologically than V1.
9. Only then has the team evaluated and decided whether to change headings.
10. The accepted doctrine, implemented rules, test evidence, and rollout decision are recorded in durable repository documents.

## First Execution Goal

Copy this into the implementation thread:

```text
Implement Astra Semantic Synthesis V2 Phase 0 and Phase 1 from docs/inbox-astra/active/ASTRA_SEMANTIC_SYNTHESIS_V2_HANDOFF.md. First lock the interpretive doctrine and produce a verified current-support inventory for every Tier A signal. Then normalize first-class angles, lunar nodes, the complete approved aspect set including quincunx, retrograde state, angularity, house mode, and the metadata required for configuration geometry and applying/separating aspects. Keep all work inside the existing astrology package and existing test architecture. Preserve calculation-mode integrity, Semantic Synthesis V1 behavior, canonical Identity, report fallbacks, routes, database contracts, and UI. Do not begin meaning-complex generation, report heading changes, or prose tuning until the Phase 1 deterministic fixtures and calculation-mode leakage gates pass. Deliver the doctrine decision, implementation, tests, exact evidence, and the next bounded Phase 2 goal.
```

## Phase 0 and Phase 1 Completion — 2026-07-26

Phase 0 and Phase 1 are complete on `codex/astra-semantic-synthesis-v2-phase-0-1`.

Delivered:

- accepted doctrine: `docs/decisions/ASTRA_SEMANTIC_SYNTHESIS_V2_INTERPRETIVE_DOCTRINE.md`;
- verified Tier A inventory and calculation-library gap analysis: `docs/architecture/ASTRA_SEMANTIC_SYNTHESIS_V2_TIER_A_INVENTORY.md`;
- normalized natal facts: `packages/astrology/src/normalizedChartFacts.ts`;
- current-engine adapter: `buildAstrologyNormalizedChartFacts`;
- deterministic fixture and calculation-mode gate: `scripts/smoke-semantic-synthesis-v2-phase-1.mts`.

Gate command:

```bash
npm run test:semantic-synthesis-v2-phase-1
```

Verified outcomes:

- first-class Ascendant, Midheaven, Descendant, and IC;
- explicit mean North/South Node pair;
- conjunction, opposition, square, trine, sextile, and quincunx with ordinary and configuration orbs;
- applying/separating metadata where motion exists;
- planetary retrograde state;
- angular, succedent, and cadent house classification;
- provenance on every normalized point, aspect, angle, node, and cusp;
- no angle, house, cusp, or house-mode facts in `signs-aspects-only`;
- no report headings, prose, prompts, meaning complexes, routes, UI, database contracts, or packages changed.

### Next bounded Phase 2 goal

```text
Implement only Phase 2 of Astra Semantic Synthesis V2. Derive traditional chart ruler, house rulers, dispositors, chains, loops, final dispositors, mutual reception, angular contacts, cusp proximity, the locked major configurations, chart-wide distributions, lunar phase, and personal activation of outer planets, Chiron, and nodes from the Phase 1 normalized facts. Add synthetic positive and near-miss fixtures for every rule, retain complete raw-fact provenance, and preserve the signs-aspects-only leakage gate. Do not begin meaning complexes, report-view integration, heading changes, or prose tuning.
```

## Phase 2 Completion — 2026-07-26

Phase 2 is complete on `codex/astra-semantic-synthesis-v2-phase-2`.

Delivered:

- structural derivation module: `packages/astrology/src/structuralChartFacts.ts`;
- current-engine adapter: `buildAstrologyStructuralChartFacts`;
- updated accepted Phase 2 policies in `docs/decisions/ASTRA_SEMANTIC_SYNTHESIS_V2_INTERPRETIVE_DOCTRINE.md`;
- verified current Tier A inventory in `docs/architecture/ASTRA_SEMANTIC_SYNTHESIS_V2_TIER_A_INVENTORY.md`;
- deterministic positive, outside-orb near-miss, actual-chart, provenance, and calculation-mode gate: `scripts/smoke-semantic-synthesis-v2-phase-2.mts`.

Gate command:

```bash
npm run test:semantic-synthesis-v2-phase-2
```

Verified outcomes:

- traditional chart ruler, house rulers, ruler location, dispositors, chains, loops, final dispositors, mutual reception, and separate modern affinities;
- ordinary and nodal angular contacts plus Placidus-only cusp proximity;
- conjunction clusters, maximal stellia, T-squares, Grand Crosses, Grand Trines, Kites, Yods, and Mystic Rectangles;
- element, modality, polarity, hemisphere, quadrant, and house-mode distributions;
- deterministic eight-sector lunar phase;
- bounded personal activation for outer planets, Chiron, and lunar nodes;
- raw-fact provenance on every derived fact;
- no full-mode chart ruler, house ruler, angular contact, cusp, house distribution, house stellium, or angle activation evidence in `signs-aspects-only`;
- no report generation, report-view integration, meaning complexes, headings, prompts, prose, routes, UI, or database contracts changed.

### Later report-comparison constraint

Phase 2 performs calculation tests only. When report integration is ready for human comparison, generate one Tony Deep report and compare it with a recent V1 Tony Deep report. Do not expand the first report comparison into a matrix.

### Next bounded Phase 3 goal

```text
Implement only Phase 3 of Astra Semantic Synthesis V2. Build the typed in-memory meaning-complex network from Phase 1 normalized facts and Phase 2 structural facts. Add evidence-path expansion, independent-support counting, duplicate-origin collapse, counterevidence selection, transparent component scoring, confidence tiers, claim boundaries, and inspectable deterministic output. Prove that aliases cannot inflate confidence, contradictory evidence remains visible, and unpersonalized outer-planet, Chiron, or node evidence cannot anchor a strong complex. Preserve every calculation-mode leakage gate. Do not integrate report views, generate reports, change headings, or tune prose.
```
