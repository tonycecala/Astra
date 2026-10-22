---
title: "Paragraph opening counts are not source checks"
type: "warning"
description: "Do not use paragraph-opening counts to force paid rewrites of accepted prose."
status: "active"
project: "astra"
created: "2026-09-19"
date: "2026-09-19"
updated: "2026-09-19"
timestamp: "2026-09-19"
okf_version: "0.1"
tags: ["warning", "captured"]
related: []
---
# Paragraph opening counts are not source checks

## What Happened
Personal/Life Chapter V4 retired its hard paragraph-start quota after two saved drafts with four flagged openings out of twenty passed the existing whole-report meaning/source review unchanged. Moving one introductory clause also changed quota acceptance without changing the proposition. Preserve evidence-reference, private-leak and material semantic checks; do not trigger paid regeneration solely from this stylistic count. Evidence and bounded implementation: docs/evaluations/REPORT_SIMPLIFICATION_TESTS_2026_09_19.md.

## Why It Happened
A lexical threshold was being used as a proxy for the usefulness of the complete reading. It was sensitive to clause order while being indifferent to source accuracy and meaning.

## How To Avoid It
Keep such counts diagnostic. Before adding a stylistic rejection rule, test unchanged acceptable drafts and meaning-preserving variations. Assert the number of model calls and exact prose preservation in a mocked zero-edit pipeline. Preserve independent evidence, privacy and semantic checks. This evidence applies to the specific Personal/Life Chapter quota; it does not qualify every draft or retire other safeguards.
