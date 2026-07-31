---
title: "Shared report readers must suppress private Evidence traces"
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
# Shared report readers must suppress private Evidence traces

## What Happened
A reader component reused by owner and public-share routes can accidentally render deterministic Evidence, stable trace IDs, or internal review notes on the logged-out share. Treat shared mode as an explicit data boundary: suppress private proof before rendering and assert that shared HTML and response payloads contain none of it.

## Why It Happened

The private and shared pages both pass a full report request and result into
the same reader. Evidence is reconstructed from that request before the reader
checks its `shared` presentation state, so a UI reuse decision silently becomes
a data-exposure decision. Hiding owner actions does not hide owner-only proof.

## How To Avoid It

1. Make the public/private mode explicit before building Evidence or internal
   review content.
2. Render the public share from a sanitized view: portrait prose and approved
   public metadata only.
3. Keep private Evidence indexes, stable IDs, trace mappings, and review notes
   out of the public component props where practical, not merely behind a
   collapsed disclosure.
4. Test the logged-out share's rendered DOM and response payload for the
   absence of technical evidence, trace IDs, and internal review text.
