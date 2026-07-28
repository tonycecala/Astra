---
title: Astra Synastry V2 Architecture
type: architecture
description: Interaspect-only synastry evidence planning, reciprocal perspective, and Alpha retention boundaries.
status: current
project: Astra Clean Start
created: 2026-07-27
updated: 2026-07-27
tags: [astrology, synastry, reports, evidence-planning]
---

# Astra Synastry V2 Architecture

## Purpose

Synastry V2 improves the *private evidence plan* while preserving the original
connection-first Synastry editorial experience. It is not a second calculation
engine and it is not a new report format.

## Authority and scope

- Astra remains the sole chart and interaspect calculation authority behind the
  unchanged `@astra/astrology` facade.
- The product remains interaspect-only: no house overlays, angle contacts,
  nodes, composites, or Davison charts are introduced here.
- The four existing chapter headings and their public contracts stay fixed.
- Caelus remains reference-only research, never a production dependency.

## Evidence-to-prose boundary

For each chapter, planning selects two or three named interaspects with:

1. chapter-specific evidence ownership;
2. a bounded contribution for each selected contact;
3. one counterweight and one distinct chapter conclusion;
4. a pair-level chart-input certainty boundary.

The writer receives first names and selected interaspect labels only. It does
not receive raw degrees, numeric orbs, individual natal placements,
provenance/graph traversal, or mechanical claim-plan markers. This retains the
specific relational texture of the original Synastry writer without inviting
unsupported precision or generic Sun-sign narration.

## Time certainty

If either input chart is signs-and-aspects-only, the pair is
signs-and-aspects-only. Time-sensitive cross-chart facts are excluded before
the writer packet exists. The policy is pair-level so a fully timed comparison
chart cannot leak house, cusp, or angle implications into an uncertain pair.

## Perspective

Every Synastry request has a report basis:

- **Primary reader**: the originating chart is the reader; or
- **Comparison reader**: the comparison chart is the reader.

Reciprocal perspective swaps the report basis and writer address before the
report is saved. The interaspect calculation is unchanged; the resulting report
is a distinct library item, not an overwrite of the first reading.

## Alpha acceptance policy

Synastry is in Alpha. A single provider attempt may produce a parseable report
that is factually and safety-valid but has editorial review findings. Retain
that report and attach review notes in generation metadata rather than
spending on automatic retries or discarding useful prose. Factual astrology,
privacy, and relationship-safety failures remain genuine blockers.

Orb validation distinguishes a real numerical/exactness claim from ordinary
symbolic language. It must not reject a report merely for words such as
“intensity” when no precision is asserted.

## Rendering boundary

Writers sometimes terminate a report with Markdown `---`. The report body
strips only terminal writer markers before Markdown rendering. Legitimate
in-body rules remain supported; terminal markers do not become raw dashes,
extra horizontal rules, or duplicate separators beside an Evidence boundary.

## Verification

The Synastry V2 closeout ran deterministic report-basis, engine, model-strategy,
paragraph, quality, rule-catalog, and public-API checks; lint, typecheck,
production build, and diff validation; and rendered browser checks of the
reciprocal request flow and a saved report at desktop, tablet, and mobile.
