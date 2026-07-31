---
title: "Safe stale-worktree integration"
type: "skill"
description: "Akashic skill artifact."
status: "draft"
project: "akashic"
created: "2026-07-31"
date: "2026-07-31"
updated: "2026-07-31"
timestamp: "2026-07-31"
okf_version: "0.1"
tags: ["skill", "captured"]
related: []
---
# Safe stale-worktree integration

## Problem
At implementation closeout, classify every worktree as active, merged, or intentionally parked. Before replaying an old dirty branch, checkpoint coherent work and compare its affected-file tree against known target commits. If the result is byte-identical to an existing target commit and later refactors have evolved it, use a history-only merge to record ancestry while preserving the newer target tree. Validate only the resulting target diff.

## Signals
TBD

## Root Cause
TBD

## Investigation
TBD

## Resolution
TBD

## Prevention
TBD

## Related Files
- None yet.

## Related ADRs
- None yet.
