---
title: Astra Semantic Synthesis V2 Tier A Signal Inventory
status: verified-phase-5-hold
type: implementation-inventory
project: Astra Clean Start
created: 2026-07-26
updated: 2026-07-26
scope: Phase 0 through Phase 5
---

# Astra Semantic Synthesis V2 Tier A Signal Inventory

## Status key

- `complete`: deterministic production calculation and provenance exist.
- `partial`: some raw inputs or policy exist, but the required derived structure does not.
- `absent`: deliberately not implemented yet.
- `blocked`: the selected calculation source cannot provide trustworthy input.

The baseline column describes Semantic Synthesis V1 before V2. The current-result column describes the verified deterministic state after Phase 5. Semantic report rollout remains on HOLD.

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

Phase 1 keeps the mean-node policy, derives aspect phase from deterministic next-day motion, and supplies normalization and provenance. Phase 2 derives the missing structural astrology from those facts without adding a dependency.

## Tier A inventory

| Required signal | V1 baseline | Current result | Owner |
|---|---|---|---|
| Ascendant | partial | complete | Phase 1 |
| Midheaven | partial | complete | Phase 1 |
| Descendant | absent | complete | Phase 1 |
| IC | absent | complete | Phase 1 |
| Planet conjunctions to angles | partial | complete | Phase 1 |
| Angular/succedent/cadent house class | absent | complete | Phase 1 |
| Cusp proximity | absent | complete for Placidus; suppressed for Whole Sign | Phase 2 |
| Full-mode eligibility gate for angles/houses/cusps | partial | complete | Phase 1 |
| North Node and South Node pair | absent | complete | Phase 1 |
| Explicit mean-node policy | absent | complete | Phase 0/1 |
| Node sign | absent | complete | Phase 1 |
| Node house when eligible | absent | complete | Phase 1 |
| Tight node conjunction/opposition | absent | complete | Phase 1 |
| Node ruler and dispositor pathways | absent | complete | Phase 2 |
| Bounded node claim policy | absent | complete | Phase 0 |
| Traditional sign rulers | partial | complete | Phase 2 |
| Chart ruler | absent | complete in full mode | Phase 2 |
| House rulers | absent | complete in full mode | Phase 2 |
| Ruler-of-house-in-house paths | absent | complete in full mode | Phase 2 |
| Planetary dispositors | absent | complete | Phase 2 |
| Final dispositor | absent | complete with global/component scope | Phase 2 |
| Mutual reception | absent | complete | Phase 2 |
| Dispositor loops and chains | absent | complete | Phase 2 |
| Labeled modern ruler affinity | absent | complete and separate from primary graph | Phase 2 |
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
| Chart-ruler aspect relevance | absent | complete with transparent component weighting | Phase 2/3 |
| Outer-planet personalization | absent | complete | Phase 2 |
| Duplicate-derived-importance collapse | partial | complete with raw-origin alias collapse | Phase 3 |
| Conjunction clusters | absent | complete | Phase 2 |
| Stellia | absent | complete | Phase 2 |
| T-square | absent | complete | Phase 2 |
| Grand Cross | absent | complete | Phase 2 |
| Grand Trine | absent | complete | Phase 2 |
| Kite | absent | complete | Phase 2 |
| Yod | absent | complete | Phase 2 |
| Mystic Rectangle | absent | complete | Phase 2 |
| Configuration participants/focal planet/orbs | absent | complete | Phase 2 |
| Element emphasis/relative absence | partial | complete as counted structure | Phase 2 |
| Modality emphasis/relative absence | partial | complete as counted structure | Phase 2 |
| Polarity balance | absent | complete | Phase 2 |
| Hemisphere emphasis | absent | complete in full mode | Phase 2 |
| Quadrant emphasis | absent | complete in full mode | Phase 2 |
| House-mode emphasis | absent | complete in full mode | Phase 2 |
| Sun-Moon aspect | partial | complete as normalized aspect | Phase 1 |
| Lunar phase | absent | complete | Phase 2 |
| Luminary rulers/dispositors | absent | complete | Phase 2 |
| Solar-lunar reinforcement/tension | partial | complete as typed support/counterevidence paths | Phase 3 |
| Personalized outer planets | absent | complete | Phase 2 |
| Personalized Chiron | absent | complete | Phase 2 |
| Personalized lunar nodes | absent | complete | Phase 2 |
| Generational-context boundary | partial | complete policy and activation selection | Phase 0/2 |
| Planetary retrograde state | partial | complete | Phase 1 |
| Retrograde interpretation boundary | absent | complete | Phase 0 |

No Tier A item is blocked by missing calculation provenance in Phase 1. True lunar nodes are intentionally outside the accepted mean-node doctrine rather than silently approximated.

## Bounded implementation map

| Boundary | Responsibility |
|---|---|
| `packages/astrology/src/normalizedChartFacts.ts` | Phase 1 fact types, aspect rules, normalization, provenance, and signs-only omission |
| `packages/astrology/src/index.ts` | Adapt current calculated horoscope output into normalized and structural facts |
| `packages/astrology/src/structuralChartFacts.ts` | Phase 2 rulership, geometry, distribution, lunar-phase, and personalization derivation |
| `packages/astrology/src/meaningComplexNetwork.ts` | Phase 3 typed graph, evidence paths, origin collapse, scoring, confidence, counterevidence, and claim boundaries |
| `packages/astrology/src/meaningComplexReportViews.ts` | Phase 4 canonical Identity and distinct Core/Deep view selection |
| `scripts/smoke-semantic-synthesis-v2-phase-1.mts` | Synthetic geometry, near-miss, provenance, deterministic, and calculation-mode gates |
| `scripts/smoke-semantic-synthesis-v2-phase-2.mts` | Positive and near-miss fixtures for every Phase 2 rule plus actual-chart and leakage gates |
| `scripts/smoke-semantic-synthesis-v2-phase-3.mts` | Graph, alias, contradiction, confidence, provenance, determinism, actual-chart, and leakage gates |
| `scripts/smoke-semantic-synthesis-v2-phase-4.mts` | Canonical Identity, Core/Deep depth, V1 fallback, context stability, card adaptation, determinism, and leakage gates |
| `docs/decisions/ASTRA_SEMANTIC_SYNTHESIS_V2_INTERPRETIVE_DOCTRINE.md` | Accepted astrological school and exact rule policies |
| this inventory | Verified capability map and bounded next ownership |

Phases 1 through 4 add no package, route, database contract, public contract, UI, heading, prompt, prose pass, graph service, or external registry.

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

## Phase 2 gate evidence

The focused Phase 2 gate proves:

- traditional chart ruler, house rulers, ruler location, dispositors, terminating chains, loops, final dispositors, and mutual reception;
- labeled modern affinities remain separate from traditional ruler edges;
- ordinary and nodal angular-contact positives and outside-orb near misses;
- Placidus cusp proximity, outside-orb rejection, and Whole Sign suppression;
- exact positive and outside-configuration-orb fixtures for every locked configuration;
- maximal stellium and connected conjunction-cluster rules;
- element, modality, polarity, hemisphere, quadrant, and house-mode counts without Chiron/node/angle inflation;
- all eight lunar phases and exact sector-boundary behavior;
- positive and near-miss personalization for outer planets, Chiron, and nodes, including chart-ruler, angle, and node activators;
- complete raw-fact provenance on every derived object;
- total removal of chart ruler, house rulers, angular contacts, cusp proximity, house distributions, house-based stellia, and angle-based activation in `signs-aspects-only`;
- deterministic structural output for identical inputs across the Tropical/Sidereal and Whole Sign/Placidus calculation matrix.

Command:

```bash
npm run test:semantic-synthesis-v2-phase-2
```

## Phase 3 gate evidence

The focused Phase 3 gate proves:

- required typed nodes and edges exist in an inspectable in-memory network;
- evidence expansion never exceeds three typed edges;
- every node, edge, path, and complex retains raw-fact provenance;
- identical facts and settings produce byte-equivalent structured output;
- aliases sharing one raw origin collapse and cannot raise confidence or score;
- independent support uses non-overlapping raw-fact origins;
- contradictory evidence remains visible and reduces confidence;
- every score exposes all accepted positive and weakening components;
- `strong` confidence always has at least three independent support paths;
- unpersonalized outer planets and Chiron are suppressed as complex seeds while a personally activated node remains eligible;
- signs-only output contains no angle, house, cusp, house-ruler, or life-area evidence;
- the current Tony control chart passes deterministic full and signs-only construction without report generation.

Command:

```bash
npm run test:semantic-synthesis-v2-phase-3
```

## Phase 4 gate evidence

The focused Phase 4 gate proves:

- canonical Identity selection is deterministic and identical across Identity, Core, Deep, and relationship contexts;
- canonical Identity contains supported Sun and Moon complexes and no more than four complexes;
- Core has three distinct non-Identity primary complexes;
- Deep retains all Core complexes, expands to five through seven complexes, and gives every selected complex a visible chapter job;
- shared roots have distinct chapter jobs and non-identical evidence packets;
- schema-version-2 natal reports consume meaning-complex evidence through the existing enriched-card path;
- legacy requests without V2 complexes retain an exact V1 evidence-card fixture;
- signs-only report cards contain no house, angle, or cusp evidence;
- no heading, route, database contract, public contract, package, or UI changes are required.

Command:

```bash
npm run test:semantic-synthesis-v2-phase-4
```
