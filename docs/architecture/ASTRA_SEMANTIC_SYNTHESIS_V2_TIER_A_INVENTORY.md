---
title: Astra Semantic Synthesis V2 Tier A Signal Inventory
status: verified-phase-1
type: implementation-inventory
project: Astra Clean Start
created: 2026-07-26
updated: 2026-07-26
scope: Phase 0 and Phase 1
---

# Astra Semantic Synthesis V2 Tier A Signal Inventory

## Status key

- `complete`: deterministic production calculation and provenance exist.
- `partial`: some raw inputs or policy exist, but the required derived structure does not.
- `absent`: deliberately not implemented yet.
- `blocked`: the selected calculation source cannot provide trustworthy input.

The baseline column describes Semantic Synthesis V1 before this phase. The Phase 1 column describes the verified state after this implementation.

## Verified calculation-library capabilities

`circular-natal-horoscope-js@1.1.0` provides:

- Tropical and Sidereal longitudes.
- Whole Sign and Placidus houses and cusps.
- Ascendant and Midheaven.
- Mean ascending node, mean descending node, and mean lunar apogee.
- Sun through Pluto, Chiron, exact longitude, house, and planetary retrograde state.
- Geometric conjunction, opposition, square, trine, sextile, and quincunx with raw orb.

It does not directly provide:

- a true-node option;
- applying or separating labels;
- Astra's aspect hierarchy or tighter configuration orbs;
- angularity classes;
- ruler, dispositor, reception, distribution, lunar-phase, personalization, or configuration structures;
- production-grade provenance objects.

Phase 1 keeps the mean-node policy, derives aspect phase from deterministic next-day motion, and supplies the missing normalization and provenance. No new dependency was added.

## Tier A inventory

| Required signal | V1 baseline | Phase 1 result | Next owner |
|---|---|---|---|
| Ascendant | partial | complete | Phase 1 |
| Midheaven | partial | complete | Phase 1 |
| Descendant | absent | complete | Phase 1 |
| IC | absent | complete | Phase 1 |
| Planet conjunctions to angles | partial | complete | Phase 1 |
| Angular/succedent/cadent house class | absent | complete | Phase 1 |
| Cusp proximity | absent | absent | Phase 2 |
| Full-mode eligibility gate for angles/houses/cusps | partial | complete | Phase 1 |
| North Node and South Node pair | absent | complete | Phase 1 |
| Explicit mean-node policy | absent | complete | Phase 0/1 |
| Node sign | absent | complete | Phase 1 |
| Node house when eligible | absent | complete | Phase 1 |
| Tight node conjunction/opposition | absent | complete | Phase 1 |
| Node ruler and dispositor pathways | absent | absent | Phase 2 |
| Bounded node claim policy | absent | complete | Phase 0 |
| Traditional sign rulers | partial | partial | Phase 2 |
| Chart ruler | absent | absent | Phase 2 |
| House rulers | absent | absent | Phase 2 |
| Ruler-of-house-in-house paths | absent | absent | Phase 2 |
| Planetary dispositors | absent | absent | Phase 2 |
| Final dispositor | absent | absent | Phase 2 |
| Mutual reception | absent | absent | Phase 2 |
| Dispositor loops and chains | absent | absent | Phase 2 |
| Labeled modern ruler affinity | absent | absent | Phase 2 |
| Conjunction | complete | complete with metadata | Phase 1 |
| Opposition | complete | complete with metadata | Phase 1 |
| Square | complete | complete with metadata | Phase 1 |
| Trine | complete | complete with metadata | Phase 1 |
| Sextile | complete | complete with metadata | Phase 1 |
| Quincunx | partial | complete with metadata | Phase 1 |
| Aspect-specific ordinary orbs | partial | complete | Phase 0/1 |
| Tighter configuration orbs | absent | complete metadata | Phase 0/1 |
| Applying/separating phase | absent | complete when motion exists | Phase 1 |
| Luminary/personal/angle/node point kinds | partial | complete | Phase 1 |
| Chart-ruler aspect importance | absent | absent | Phase 2 |
| Outer-planet personalization | absent | absent | Phase 2 |
| Duplicate-derived-importance collapse | partial | partial | Phase 3 |
| Conjunction clusters | absent | absent | Phase 2 |
| Stellia | absent | absent | Phase 2 |
| T-square | absent | absent | Phase 2 |
| Grand Cross | absent | absent | Phase 2 |
| Grand Trine | absent | absent | Phase 2 |
| Kite | absent | absent | Phase 2 |
| Yod | absent | absent | Phase 2 |
| Mystic Rectangle | absent | absent | Phase 2 |
| Configuration participants/focal planet/orbs | absent | absent | Phase 2 |
| Element emphasis/relative absence | partial | absent as V2 structure | Phase 2 |
| Modality emphasis/relative absence | partial | absent as V2 structure | Phase 2 |
| Polarity balance | absent | absent | Phase 2 |
| Hemisphere emphasis | absent | absent | Phase 2 |
| Quadrant emphasis | absent | absent | Phase 2 |
| House-mode emphasis | absent | partial; point facts complete | Phase 2 |
| Sun-Moon aspect | partial | complete as normalized aspect | Phase 1 |
| Lunar phase | absent | absent | Phase 2 |
| Luminary rulers/dispositors | absent | absent | Phase 2 |
| Solar-lunar reinforcement/tension | partial | absent as V2 structure | Phase 3 |
| Personalized outer planets | absent | absent | Phase 2 |
| Personalized Chiron | absent | absent | Phase 2 |
| Generational-context boundary | partial | complete policy; selection pending | Phase 0/2 |
| Planetary retrograde state | partial | complete | Phase 1 |
| Retrograde interpretation boundary | absent | complete | Phase 0 |

No Tier A item is blocked by missing calculation provenance in Phase 1. True lunar nodes are intentionally outside the accepted mean-node doctrine rather than silently approximated.

## Bounded implementation map

| Boundary | Responsibility |
|---|---|
| `packages/astrology/src/normalizedChartFacts.ts` | Phase 1 fact types, aspect rules, normalization, provenance, and signs-only omission |
| `packages/astrology/src/index.ts` | Adapt current calculated horoscope output into normalized Phase 1 facts |
| `scripts/smoke-semantic-synthesis-v2-phase-1.mts` | Synthetic geometry, near-miss, provenance, deterministic, and calculation-mode gates |
| `docs/decisions/ASTRA_SEMANTIC_SYNTHESIS_V2_INTERPRETIVE_DOCTRINE.md` | Accepted astrological school and exact rule policies |
| this inventory | Verified capability map and bounded next ownership |

Phase 1 adds no package, route, database contract, public contract, UI, heading, prompt, prose pass, meaning complex, graph service, or external registry.

## Phase 1 gate evidence

The focused gate proves:

- every approved aspect and outside-orb near miss;
- ordinary versus configuration geometry eligibility;
- applying and separating cases;
- angle conjunction and outside-orb cases;
- mean node pairing and tight node contacts;
- retrograde normalization;
- angular, succedent, and cadent classification;
- deterministic output for identical input;
- Tropical/Sidereal evidence changes;
- Whole Sign/Placidus cusp changes;
- total removal of houses, house modes, angles, and cusps in `signs-aspects-only`;
- house-system independence in reduced mode.

Command:

```bash
npm run test:semantic-synthesis-v2-phase-1
```
