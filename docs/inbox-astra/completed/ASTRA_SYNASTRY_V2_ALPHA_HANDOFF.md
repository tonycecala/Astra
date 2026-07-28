---
title: Astra Synastry V2 Alpha Handoff
status: completed
owner: Codex
created: 2026-07-27
completed: 2026-07-27
branch: codex/synastry-v2
---

# Astra Synastry V2 Alpha Handoff

## Completed scope

Synastry V2 is complete for Alpha. It preserves Astra as the sole calculation
authority, the unchanged `@astra/astrology` facade, existing report contracts,
routes, schema, persistence, fixed headings, and relationship-safety boundary.
No Caelus dependency, composite, Davison, house-overlay, angle-contact, or
node feature was added.

### Private evidence planning

- Interaspect-only evidence is selected per chapter with two or three named
  contacts, chapter ownership, a bounded contribution, a counterweight, and a
  distinct conclusion.
- Pair-level time certainty prevents time-sensitive cross-chart claims whenever
  either source chart is signs-and-aspects-only.
- The writer receives first names and selected named interaspects only. Raw
  degrees, orb values, individual natal placements, provenance/graph data, and
  claim-plan mechanics are absent.
- The editorial output remains the original connection-first Synastry shape:
  a warm, contact-led relational opening rather than generic Sun-sign
  comparison.

### Alpha generation policy

- One provider attempt; no automatic prose retry loop for Synastry.
- A parseable report that passes genuine factual, privacy, and relationship
  safety validation is retained.
- Editorial review concerns are saved as generation metadata and presented as
  an Alpha review note rather than discarding useful prose.
- Orb review only flags actual numerical or exactness claims. Symbolic language
  such as “intensity” is not treated as an orb assertion.

### Reciprocal reader perspective

The request UI offers **Primary reader** and **Comparison reader**. The latter
swaps report basis and writer address before persistence, yielding a separate
saved reciprocal report with the same mathematics and fixed headings. An Ally
can select the user’s saved Self chart as a comparison candidate.

### Report presentation repair

Terminal writer `---` markers are stripped from the report body before Markdown
rendering. This removes raw visible dashes and avoids duplicate rules near the
Evidence boundary while preserving legitimate in-body rules.

## Validation evidence

Passed at closeout:

- report basis, display-title, paragraph, model-strategy, engine, Deep-quality,
  rule-catalog, and public-API deterministic checks;
- lint, typecheck, production build, and `git diff --check`;
- rendered browser verification of the reciprocal Ally-to-Synastry request
  journey at desktop, tablet, and mobile, without submitting a new report;
- rendered browser verification of a saved Synastry report at desktop and
  mobile: no raw dashes, no duplicate terminal rule, no overflow, console
  errors, or page errors.

No model calls were made as part of the reciprocal-control or separator repair
verification.

## Operator use

To create the reciprocal view, begin from either participant’s saved chart,
choose Synastry, select the other chart, then choose that other chart’s
**Comparison reader** option before ordering. The library keeps both views as
separate reports.

## Do not reopen

- Do not restore the rejected Phase 5.2 operation-reconciliation prompt.
- Do not add phrase-specific prose detectors for editorial preference.
- Do not reintroduce automatic Synastry retries that throw away valid Alpha
  prose.
- Do not add a second astrology authority or derived chart system without a new
  scoped product decision.

## Related records

- Architecture: `docs/architecture/ASTRA_SYNASTRY_V2.md`
- Phase 5.1 baseline and Caelus findings:
  `docs/evaluations/ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_EVALUATION.md`
- Original V2 handoff:
  `docs/inbox-astra/completed/ASTRA_SEMANTIC_SYNTHESIS_V2_HANDOFF.md`

## Recommended next task

```text
Review the retained Synastry Alpha reports in the Library, including one reciprocal
Felicia + Tony reading. Capture only factual, privacy, or relationship-safety
failures as bugs. Treat style preferences as prompt/editorial research, not retry
triggers. Do not add derived-chart features without a separately approved scope.
```
