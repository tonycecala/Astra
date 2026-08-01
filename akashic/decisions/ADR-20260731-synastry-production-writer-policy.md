---
title: "Synastry production writer policy"
type: "decision"
description: "Akashic decision artifact."
status: "accepted"
project: "akashic"
created: "2026-07-31"
date: "2026-08-01"
updated: "2026-08-01"
timestamp: "2026-08-01"
okf_version: "0.1"
tags: ["adr", "reports", "synastry", "model-routing"]
related: []
---
# ADR: Synastry production writer policy

## Date
2026-08-01

## Status
Accepted

## Decision
Resolve new production Synastry reports to `anthropic/claude-sonnet-4.6`. Retain `anthropic/claude-sonnet-5` as the production default for every non-Synastry report type.

This applies only to reports generated after this decision. Saved reports remain immutable. Keep `ASTRA_REPORT_MODEL` unset in hosted production so request-level routing cannot be bypassed; explicit admin replay models remain available only for controlled comparisons.

## Context
The 2026-07-16 general writer bakeoff selected Sonnet 5 but did not evaluate Sonnet 4.6 for the Synastry V3.1.1 contract. A July 27 runtime change added Sonnet 4.6 as an undocumented production Synastry exception. The 2026-08-01 TC + CA controlled comparison held request, prompt, evidence, tone, provider settings, and retry policy constant while varying only the writer model. Sonnet 4.6 completed once at 1,441 words; Sonnet 5 required a corrective retry and finished below the requested word range. Tony's blinded reader review preferred the Sonnet 4.6 draft.

## Alternatives
- Keep Sonnet 5 for Synastry as well as non-Synastry reports. Rejected because the Synastry-specific comparison and blinded review favored Sonnet 4.6.
- Make Sonnet 4.6 the writer for all report families. Rejected because non-Synastry evidence still supports Sonnet 5 and was not re-evaluated here.
- Use a named per-family exception in the resolver. Selected because it makes the actual production policy explicit and testable.

## Consequences
- The resolver names and tests both production defaults: Sonnet 4.6 for Synastry and Sonnet 5 otherwise.
- The strategy document and hosted deployment guard must change with any approved writer-policy change.
- A relevant family bakeoff and owner decision are required before changing either default.
- Existing saved report content and metadata are not rewritten.
