---
title: "Private portrait reassessment must match saved sample and mode"
type: "warning"
description: "Akashic warning artifact."
status: "active"
project: "akashic"
created: "2026-07-31"
date: "2026-07-31"
updated: "2026-07-31"
timestamp: "2026-07-31"
okf_version: "0.1"
tags: ["warning", "captured"]
related: []
---
# Private portrait reassessment must match saved sample and mode

## What Happened
A grounded Tony + Rachel V2 artifact was reassessed without its `--sample tony-rachel-lover --grounded-prose-v2` flags. The harness silently used its Cheyenne default, misread every Rachel heading and paragraph trace, and overwrote the evaluation with a false failure. The correctly scoped reassessment restored the valid result.

## Why It Happened
Generation mode carried sample and variant context in CLI flags, while reassessment accepted only the output directory and reconstructed validation rules from current CLI defaults instead of the saved manifest.

## How To Avoid It
Before writing reassessment or evaluation artifacts, read the saved manifest and compare its sample and experiment version with the active CLI context. Fail before any write, and print the exact required sample or mode flag. Keep a focused regression check proving that a mismatched invocation is rejected and the correctly scoped invocation succeeds.
