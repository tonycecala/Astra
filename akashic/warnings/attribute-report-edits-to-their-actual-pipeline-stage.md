---
title: "Attribute report edits to their actual pipeline stage"
type: "warning"
description: "Akashic warning artifact."
status: "draft"
project: "akashic"
created: "2026-09-19"
date: "2026-09-19"
updated: "2026-09-19"
timestamp: "2026-09-19"
okf_version: "0.1"
tags: ["warning", "captured"]
related: []
---
# Attribute report edits to their actual pipeline stage

## What Happened
Compare the saved writer draft, raw editor response and rendered final prose separately. In the Synastry light-editor run the API editor preserved prose byte-for-byte, while existing normalizeReportVoice substitutions changed three final paragraphs. A draft-to-final diff alone misattributes those changes to the paid editor. Preserve stage artifacts and costs before evaluating editorial value.

## Why It Happened
The comparison used editor input and final saved sections as its endpoints. Markdown section parsing also applies deterministic voice substitutions, so it is a separate prose transformation after model editing.

## How To Avoid It
Save and compare raw editor prose before comparing final sections. Label model edits and deterministic replacements separately; do not use changed paragraph counts or reading-grade deltas alone to claim paid editorial benefit.
