---
title: "Ambiguous prose tokens need contextual leakage checks"
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
# Ambiguous prose tokens need contextual leakage checks

## What Happened
A clean-prose astrology scanner falsely classified ordinary uses of house, degrees, and opposite as technical leakage. Match unambiguous system terms directly, but require technical context for words that also belong to everyday language. In the opposite direction, fabricated speech includes italicized first-person interior monologue attributed to a named subject, not only text inside quotation marks.

## Why It Happened

The scanner used a flat forbidden-word list even though several astrology terms are also ordinary English. It therefore counted “pressure in a house,” “lowering your guard by degrees,” and “the opposite fear” as technical exposition. Its fabricated-dialogue check had the inverse blind spot: it matched quotation marks but missed italicized first-person sentences explicitly attributed to Cheyenne's thoughts.

## How To Avoid It

1. Match unambiguous astrology names and aspect terms directly.
2. Require technical context for ambiguous words, such as an ordinal before `house` or a number before `degrees`.
3. Test scanners against the actual prose and inspect every match before assigning a fatal category.
4. Detect attributed first-person speech across quotation marks and Markdown emphasis, not only one punctuation style.
5. Preserve generation-time findings, then record any corrected reassessment without rewriting the original raw response.
