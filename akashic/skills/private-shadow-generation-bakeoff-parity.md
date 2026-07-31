---
title: "Private shadow-generation bakeoff parity"
type: "skill"
description: "Akashic skill artifact."
status: "active"
project: "astra"
created: "2026-07-30"
date: "2026-07-30"
updated: "2026-07-30"
timestamp: "2026-07-30"
okf_version: "0.1"
tags: ["skill", "captured"]
related: []
---
# Private shadow-generation bakeoff parity

## Problem
When a one-off report bakeoff calls the provider directly, duplicate production model controls and explicitly record intentional scope differences such as a larger output ceiling. Require explicit generation approval, keep database access read-only, write prompt/source IDs/usage/cost/hashes into private ignored artifacts, retain failed attempts, and validate the accepted output without rerunning a paid call.

## Signals

- A direct provider call behaves differently from the product writer.
- A long-form report stops early despite a seemingly sufficient output limit.
- Usage metadata shows unexpected reasoning tokens or a changed temperature.
- An editorial experiment risks writing private prose back into product tables.

## Root Cause

The experimental runner selected the same model but did not duplicate the
production adapter's provider controls. Model identity alone does not establish
writer parity.

## Investigation

Compare the experimental request body with the production provider adapter.
Record model, temperature, reasoning effort, completion-token limit, finish
reason, latency, token usage, and cost. Preserve the failed output so the cause
is inspectable.

## Resolution

Pin the current approved writer and send the same production controls. Record
intentional deviations, such as a larger output ceiling required by a longer
structure. Require an explicit generation flag, use read-only source queries,
save private ignored artifacts with restrictive permissions, and provide a
validation-only mode so a completed paid output can be rechecked without
regeneration.

## Prevention

Treat model configuration as a tuple rather than a model name. Whenever the
production adapter changes, review experimental runners for parity before the
next paid bakeoff.

When evaluating a new report architecture, calculate one canonical signal
packet directly from the source charts. Keep prior reports as blind editorial
benchmarks rather than writer inputs. A curated strongest-signal packet is not
an exhaustive chart, so prompts and evaluations must reject conclusions built
from the presumed absence of unlisted contacts.

## Related Files
- `packages/astrology/src/report/providerResponse.ts`
- `scripts/experiments/run-dual-perspective-synastry-bakeoff.mts`
- `akashic/playbooks/astra-verification-tiers.md`

## Related ADRs
- None yet.
