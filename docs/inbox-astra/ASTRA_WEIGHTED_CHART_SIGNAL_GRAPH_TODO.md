---
title: Astra Weighted Chart Signal Graph
status: active
type: future-implementation-brief
project: Astra Clean Start
author: Tony + Codex
created: 2026-07-16
priority: P2
audience: Codex / engineering agents
mission: Add inspectable multi-signal astrological synthesis using only trustworthy chart evidence.
depends_on: ASTRA_CHART_LOCATION_INTEGRITY_AND_SIGNAL_GRAPH.md
---

# Weighted Chart Signal Graph TODO

## Goal

Build Astra's first weighted chart-signal graph so report sections can synthesize networks of mutually supporting placements, aspects, rulerships, and themes instead of treating isolated facts as equally important.

## Boundaries

- Use signs and interplanetary aspects for every trustworthy chart.
- Use houses, angles, and house rulership only when `calculationMode` is `full`.
- Exclude legacy/unknown house and angle provenance from weighted evidence.
- Keep the graph between chart calculation and signal cards. It ranks evidence; it does not write prose.
- Do not add graph controls or technical choices to the customer UI.

## Plan

1. Define typed graph contracts for placement nodes, aspect/rulership edges, theme nodes, evidence references, and ordinal weights.
2. Build the graph deterministically from the immutable report basis snapshot and calculated chart evidence.
3. Start with transparent weights: luminaries and eligible Ascendant; tight personal-planet aspects; eligible angular factors; repeated themes; personal placements; tightly connected outer planets.
4. Add orb decay and deduplication so one chart fact cannot inflate a theme through several derived labels.
5. Cluster supported evidence into the existing report domains and require at least two independent supports for a high-priority synthesized theme.
6. Feed ranked clusters into existing section signal cards while preserving the current prose writer boundary.
7. Add inspectable debug provenance showing exactly which chart facts raised each theme and why.
8. Evaluate the same trusted Self and Ally charts across Tropical/Sidereal and Whole Sign/Placidus; confirm expected evidence changes and zero house/angle leakage in signs-only mode.
9. Compare Deep report specificity, repetition, readability, cost, and astrologer usefulness against the current pipeline.
10. Verify Library debug presentation and report output, document the weighting rules, and commit as one scoped change.

## Acceptance

- Every ranked theme links to its supporting chart facts.
- No signs-only graph contains houses, Ascendant, Midheaven, angles, or house rulership.
- High-priority themes have at least two independent supporting signals.
- Settings changes alter graph evidence when the underlying calculation changes.
- Deep prose becomes more specific and connected without becoming longer, denser, or more repetitive.
- An astrologer can inspect and challenge the graph's reasoning without reading implementation code.

## Source Design

See `docs/decisions/ASTRA_CHART_LOCATION_INTEGRITY_AND_SIGNAL_GRAPH.md` for the accepted calculation-mode contract, eligible inputs, graph shape, initial weighting order, and evaluation design.
