---
title: Astra Semantic Synthesis V2 Interpretive Doctrine
status: accepted
type: architecture-decision
project: Astra Clean Start
created: 2026-07-26
updated: 2026-07-26
decision_version: 2.0.0-phase-1
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

## Claim Boundary

Phase 0 and Phase 1 create chart facts only. They do not change headings, report prose, semantic hypotheses, meaning complexes, or customer-visible controls. Relationship context cannot alter natal geometry.

## Supersession

Changing any policy above requires a new accepted decision and updated deterministic fixtures. Prompt text or model behavior cannot silently supersede this doctrine.
