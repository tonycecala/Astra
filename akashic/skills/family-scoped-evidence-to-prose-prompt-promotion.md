---
title: "Family-scoped Evidence-to-Prose prompt promotion"
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
# Family-scoped Evidence-to-Prose prompt promotion

## Problem
When an editorial contract is approved for only some Astra report families, gate it in prompt policy, wire every writer shape for those families, preserve excluded prompts, and assert both prompt presence/absence plus family-specific provenance in a fake-provider fixture.

## Signals

- A controlled blind bakeoff selects a contract for one report family but not another.
- One product family can reach the writer through more than one orchestration shape.
- A global prompt-version value would make excluded families appear to have received a change they did not receive.

## Root Cause

Report-family routing and writer orchestration are separate axes. A prompt patch at one builder can therefore miss an ordinary fallback or broaden a contract to Identity, Welcome, Progressed, or Synastry unintentionally.

## Investigation

1. Locate every production prompt builder and the dispatch that selects it.
2. Identify each prompt shape used by approved and excluded report types.
3. Check every generation-success and generation-failure metadata path before changing provenance.

## Resolution

1. Define the contract once in `report/promptPolicies.ts` and return `[]` for excluded families.
2. Inject it into the monolithic and sectioned builders used by approved families only.
3. Give only new affected results a new prompt version; leave excluded-family provenance stable.
4. Use fake-provider fixtures to capture Core monolithic, Core sectioned, Deep chapter, and Identity prompts without an external call or persistence write.

## Prevention

- Assert prompt presence for every approved shape and absence for excluded families.
- Assert the family-specific provenance version in the same fixture.
- Update the readable prompt review and verification playbook with the exact family scope.

## Related Files
- `packages/astrology/src/report/promptPolicies.ts`
- `packages/astrology/src/report/promptBuilderContracts.ts`
- `packages/astrology/src/index.ts`
- `scripts/smoke-report-deep-quality.mts`

## Related ADRs
- None yet.
