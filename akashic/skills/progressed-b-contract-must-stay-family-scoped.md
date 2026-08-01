---
title: "Progressed B contract must stay family-scoped"
type: "skill"
description: "Akashic skill artifact."
status: "draft"
project: "akashic"
created: "2026-08-01"
date: "2026-08-01"
updated: "2026-08-01"
timestamp: "2026-08-01"
okf_version: "0.1"
tags: ["skill", "captured"]
related: []
---
# Progressed B contract must stay family-scoped

## Problem
Blind review approved the Progressed Evidence-to-Prose B contract and rejected the B+ prescriptive house-translation refinement. Promote only the winning report-specific wording, preserve its selected-evidence and dated-timing boundaries, and regress the intended family plus explicit exclusions before release.

## Signals

- The immutable Tony Cecala New York fixture favored Progressed Evidence-to-Prose B over the prior prompt in blinded reading.
- The B+ refinement made house-to-lived-domain explanation prescriptive and lost its blinded editorial comparison.
- Progressed needs supported dated timing and selected progressed/progressed-to-natal evidence; Core, Deep, Identity, and Synastry have different evidence and writer paths.

## Root Cause

An appealing trait in one generated report can be mistaken for the causal prompt instruction. The controlled B+ comparison showed that making the house explanation mandatory was not the approved behavior.

## Investigation

Compare the exact blind-winning B contract with the focused refinement on the same immutable fixture. Inspect the production prompt-builder path and prove model-written provenance is recorded only for the family that receives the new contract.

## Resolution

Gate the B wording on `reportType: "progressed"` in the monolithic writer prompt. Preserve the selected-evidence, private-support, psychology-first, distinct-conclusion, and dated-timing rules without the B+ house instruction. Add a distinct Progressed prompt version.

## Prevention

Test prompt presence for Progressed and explicit absence for Identity, Core, Deep, and Synastry. Treat deterministic validation as separate from editorial cleanliness, retain one corrective retry, and require a fresh blinded comparison before broadening or refining the contract.

## Related Files
- `packages/astrology/src/report/promptPolicies.ts`
- `packages/astrology/src/report/promptBuilderContracts.ts`
- `packages/astrology/src/index.ts`
- `scripts/smoke-report-model-strategy.mts`
- `scripts/smoke-report-deep-quality.mts`

## Related ADRs
- None yet.
