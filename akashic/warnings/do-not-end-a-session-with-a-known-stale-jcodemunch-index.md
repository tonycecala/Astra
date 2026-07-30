---
title: "Do not end a session with a known-stale JCodeMunch index"
type: "warning"
description: "Refresh a known-stale JCodeMunch repository index after the verified session commit."
status: "active"
project: "astra"
created: "2026-07-30"
date: "2026-07-30"
updated: "2026-07-30"
timestamp: "2026-07-30"
okf_version: "0.1"
tags: ["warning", "captured"]
related: []
---
# Do not end a session with a known-stale JCodeMunch index

## What Happened
JCodeMunch reported an indexed commit behind Astra's working `HEAD`, so its
symbol map could not describe the current source accurately.

## Why It Happened
Repository commits advanced without refreshing the external code index.

## How To Avoid It
When a stale index is observed, finish and commit the verified session first,
refresh the repository index, and verify its indexed commit matches `HEAD`
before final handoff. The closeout order is documented in
`docs/akashic-governance.md`.
