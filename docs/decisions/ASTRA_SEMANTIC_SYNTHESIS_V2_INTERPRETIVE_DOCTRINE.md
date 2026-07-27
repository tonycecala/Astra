---
title: Astra Semantic Synthesis V2 Interpretive Doctrine
status: accepted
type: architecture-decision
project: Astra Clean Start
created: 2026-07-26
updated: 2026-07-26
decision_version: 2.0.0-phase-4
scope: natal astrology
---

# Astra Semantic Synthesis V2 Interpretive Doctrine

## Decision

Astra V2 uses a modern psychological natal voice over a deterministic structural calculation layer.

- Tropical or Sidereal zodiac is selected by the user and retained in provenance.
- Whole Sign or Placidus houses are selected by the user and retained in provenance.
- Traditional rulership is the future primary ruler graph.
- Modern outer-planet rulership may appear only as a labeled secondary affinity.
- Aspects, angles, nodes, house placement, angularity, and configurations are calculated before prose generation.
- Traditional testimony may later qualify a hypothesis. It may not become fortune-telling, moral ranking, or categorical biography.
- Chiron, lunar nodes, and outer planets cannot anchor strong personal claims without direct personal activation.
- Every production rule requires a stable identifier, definition, confidence tier, provenance, and deterministic tests.

This decision governs implementation functions. No local function may silently select a different school.

## Phase 1 Calculation Policies

### Lunar nodes

- Policy: mean node.
- Source: `circular-natal-horoscope-js@1.1.0` mean ascending node.
- The South Node is normalized to exactly 180 degrees from the North Node.
- Nodes are an explicit pair.
- Nodes may form conjunctions and oppositions only, with a maximum orb of 3 degrees.
- Nodes may describe developmental direction or familiar tendencies only after Phase 2 personalization rules exist.
- Nodes do not prove fate, past lives, events, motives, or biography.

### Ordinary natal aspects

| Aspect | Exact angle | Ordinary orb | Configuration orb |
|---|---:|---:|---:|
| Conjunction | 0° | 8° | 6° |
| Opposition | 180° | 8° | 6° |
| Square | 90° | 7° | 5° |
| Trine | 120° | 7° | 5° |
| Sextile | 60° | 5° | 4° |
| Quincunx | 150° | 3° | 2.5° |

- Planet-to-angle conjunctions use a 5-degree orb.
- Angle-to-angle aspects are not interpretive evidence.
- Node-to-angle aspects are deferred until Phase 2 activation rules.
- One aspect is stored once. Derived labels cannot increase its importance.
- Applying or separating phase is measured from the change in orb over the next hour, using deterministic daily motion from the same calculation engine.
- An aspect within 0.01 degrees is `exact`.
- An aspect without usable motion is `unknown`; angle contacts are `not_applicable`.

### Angles, houses, and angularity

- Full charts expose Ascendant and Midheaven as calculated facts.
- Descendant and IC are derived as the exact opposite points of their axes.
- Houses 1, 4, 7, and 10 are angular.
- Houses 2, 5, 8, and 11 are succedent.
- Houses 3, 6, 9, and 12 are cadent.
- Cusp proximity is deferred to Phase 2.
- `signs-aspects-only` charts must omit every angle, house, cusp, house mode, and future house-ruler fact.

### Retrogradation

- Planetary retrograde state is a boolean calculated fact.
- Mean nodes do not reuse the planetary retrograde flag.
- Retrograde qualifies a planet's existing role. It does not mean weakness, delay, trauma, failure, or an inward personality.

## Locked Phase 2 Geometry Policies

These definitions remove ambiguity before configuration code begins.

- Conjunction cluster: three or more eligible planets connected through conjunctions inside the 6-degree configuration orb.
- Stellium: three or more eligible planets in one sign or one house, with every adjacent longitude gap no greater than 8 degrees and the full span no greater than 16 degrees. Angles, nodes, and Chiron do not satisfy the planet count.
- T-square: two square legs to one apex plus an opposition between the base planets, using configuration orbs.
- Grand Cross: four planets forming four square sides and two oppositions, using configuration orbs.
- Grand Trine: three planets forming three trines, using configuration orbs.
- Kite: a Grand Trine plus a fourth planet opposing one trine participant and sextiling the other two.
- Yod: two quincunxes to one apex plus a sextile between the base planets.
- Mystic Rectangle: two oppositions joined by two trines and two sextiles.
- A near miss outside any required configuration orb is not the configuration.
- Each configuration stores participants, focal or apex planet when applicable, exact aspect members, signs, eligible houses, orbs, basis, and provenance.

## Phase 2 Structural Policies

### Traditional rulership and dispositors

- Primary rulers are: Mars for Aries, Venus for Taurus, Mercury for Gemini, Moon for Cancer, Sun for Leo, Mercury for Virgo, Venus for Libra, Mars for Scorpio, Jupiter for Sagittarius, Saturn for Capricorn, Saturn for Aquarius, and Jupiter for Pisces.
- The chart ruler is the traditional ruler of the Ascendant sign and exists only in `full` mode.
- A house ruler is the traditional ruler of the selected house cusp sign. Its pathway records the ruler's calculated house when eligible.
- Every luminary, planet, Chiron point, and lunar node has a sign dispositor pathway. Angles do not.
- A final dispositor is a planet in a sign it traditionally rules that terminates one or more dispositor chains. It is `global` only when every available chain terminates there.
- A dispositor loop contains two or more planets and returns to an earlier participant without reaching a self-dispositor.
- Mutual reception is the two-planet case in which each planet occupies a sign traditionally ruled by the other.
- Pluto for Scorpio, Uranus for Aquarius, and Neptune for Pisces are stored only as labeled modern affinities. They never replace the primary traditional ruler edge.

### Angular contacts and cusp proximity

- Non-node conjunctions to calculated angles use the accepted 5-degree angle orb.
- Mean lunar-node conjunctions to calculated angles use the tighter 3-degree node orb.
- Because both ends of each angle axis are first-class points, a node opposition to one angle is represented once as a conjunction to the opposite angle.
- Cusp proximity applies only to Placidus houses and uses a maximum distance of 3 degrees.
- Cusp proximity qualifies a calculated house placement; it never replaces it.
- Whole Sign houses do not create separate cusp-proximity facts.

### Configuration participants

- Luminaries and Sun-through-Pluto planets are eligible configuration participants.
- Chiron, lunar nodes, and angles do not satisfy configuration or stellium participant counts.
- A conjunction cluster is a connected component. Every connecting conjunction must pass the 6-degree configuration orb, but every participant need not conjunct every other participant.
- When several stellium subsets qualify in the same sign or house, only the maximal qualifying set is retained.

### Chart-wide distributions

- Element, modality, and polarity counts use each luminary and Sun-through-Pluto planet once. Chiron, nodes, and angles do not alter the counts.
- Positive polarity contains fire and air signs. Negative polarity contains earth and water signs.
- Northern hemisphere contains houses 1 through 6; Southern contains houses 7 through 12.
- Eastern hemisphere contains houses 10, 11, 12, 1, 2, and 3; Western contains houses 4 through 9.
- Quadrants are houses 1–3, 4–6, 7–9, and 10–12.
- House-mode counts use the accepted angular, succedent, and cadent classes.
- A zero category is relative chart emphasis only. It does not establish a missing human capacity.

### Lunar phase

- Lunar phase uses directed Moon-minus-Sun elongation normalized to 0–360 degrees.
- Eight 45-degree sectors are centered on New, First Quarter, Full, and Last Quarter and their intermediate phases.
- Boundaries occur at 22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, and 337.5 degrees.

### Personal activation

- Outer planets and Chiron are personally activated by a tight approved aspect to a luminary, Mercury, Venus, Mars, a calculated angle, a lunar node, or the traditional chart ruler.
- Lunar nodes are personally activated by a tight approved contact to a luminary, Mercury, Venus, Mars, a calculated angle, or the traditional chart ruler.
- Interplanetary activation uses the tighter configuration orb for the aspect type.
- Node contacts use 3 degrees. Angle contacts use 5 degrees, except node-to-angle contacts, which remain at 3 degrees.
- A slower factor without qualifying activation remains available as generational or developmental context. It cannot anchor a strong categorical personal claim.

## Phase 3 Meaning-Complex Policies

### Typed paths and evidence independence

- Meaning complexes are built in memory from Phase 1 normalized facts and Phase 2 structural facts.
- Evidence expansion follows typed astrological edges only and stops after three edges.
- Signs, houses, and cusps qualify style or life area. They do not independently prove behavior.
- Evidence paths that resolve to the same raw-fact origin and role collapse into one path. Their aliases remain inspectable.
- Independent support requires non-overlapping raw-fact origins after removing the seed fact itself. Repeated labels, configuration membership, angular-contact labels, and other derivations of one raw fact cannot inflate confidence.
- A complex requires at least two supported origins. `strong` confidence requires at least three independent support paths and the accepted score threshold.
- Challenging aspects remain explicit counterevidence. They qualify or reduce confidence instead of disappearing into a single clean thesis.

### Transparent scoring

Each complex stores normalized component scores for structural importance, aspect precision, angularity, chart-ruler relevance, luminary or personal-planet relevance, configuration role, independent reinforcement, life-domain relevance, contextual activation, counterevidence strength, generational weakness, derivation distance, and semantic redundancy.

The accepted weights are:

| Component | Weight |
|---|---:|
| Structural importance | 0.16 |
| Aspect precision | 0.08 |
| Angularity | 0.08 |
| Chart-ruler relevance | 0.10 |
| Luminary/personal relevance | 0.12 |
| Configuration role | 0.10 |
| Independent reinforcement | 0.14 |
| Life-domain relevance | 0.06 |
| Contextual activation | 0.06 |
| Counterevidence strength | -0.06 |
| Generational weakness | -0.10 |
| Derivation distance | -0.06 |
| Semantic redundancy | -0.08 |

The total is inspectable and bounded from zero to one. Confidence also applies explicit structural gates, so a numeric total alone cannot create `strong` confidence.

### Claim boundaries

- Meaning complexes describe supported natal tendencies, not categorical behavior, invented biography, events, motives, or another person's inner state.
- Unpersonalized outer planets, Chiron, and lunar nodes may qualify context but cannot seed a strong personal complex.
- Reduced calculation mode makes no claims from houses, angles, cusps, house rulers, or life-area emphasis.
- Phase 3 hypotheses are technical internal summaries. They are not customer prose and do not change report headings, prompts, or views.

## Phase 4 Report-View Policies

### Canonical Identity

- Canonical Identity selection is deterministic and independent of relationship context and report tier.
- The canonical view includes the Sun and Moon when supported complexes exist, then the strongest eligible chart-ruler, Ascendant, identity configuration, or identity-domain structure, up to four complexes.
- Identity uses the same primary complex, supporting complexes, and evidence budget in Identity, Core, and Deep.
- Relationship status, condition, structure, intention, recency, pronouns, notes, question, and intent do not change canonical Identity evidence.

### Core and Deep

- Core selects three distinct non-Identity complexes: one primary complex each for Relationships, Work, and Integration.
- Deep retains every Core complex and expands to between five and seven selected complexes.
- Every selected Deep complex must perform at least one visible chapter job.
- A shared root may organize more than one Deep chapter only when each use has a distinct interpretive job.
- Evidence paths for repeated roots are partitioned by chapter and ranked by the chapter's domain. The same evidence packet may not be repeated under two headings.
- The model receives selected cards, not the complete semantic graph.

### Integration and fallback boundary

- V2 view selection is applied only to schema-version-2 natal requests with an explicit calculation mode and at least one meaning complex.
- Legacy natal requests, requests without V2 complexes, Progressed reports, and Synastry reports retain the existing V1 card path unchanged.
- Phase 4 adapts selections through the existing optional `hypothesis`, `counterweight`, and `claimBoundary` card fields.
- Phase 4 adds no route, database contract, public contract, package, UI dependency, heading, or prose-style rule.

## Claim Boundary

Phases 0 through 4 create chart facts, structural facts, inspectable meaning complexes, and deterministic internal report views. They do not change headings, prose style, routes, database contracts, public contracts, or customer-visible controls. Relationship context cannot alter natal geometry or canonical Identity selection.

## Supersession

Changing any policy above requires a new accepted decision and updated deterministic fixtures. Prompt text or model behavior cannot silently supersede this doctrine.
