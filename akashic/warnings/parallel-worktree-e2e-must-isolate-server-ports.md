---
title: "Parallel worktree E2E must isolate server ports"
type: "warning"
description: "Akashic warning artifact."
status: "active"
project: "astra"
created: "2026-08-02"
date: "2026-08-02"
updated: "2026-08-02"
timestamp: "2026-08-02"
okf_version: "0.1"
tags: ["warning", "captured"]
related: []
---
# Parallel worktree E2E must isolate server ports

## What Happened
When Playwright reuseExistingServer is enabled, a listener from another checkout can make browser tests exercise the wrong branch or mismatched auth origin. Give each worktree an explicit ASTRA_E2E_BASE_URL and Composer base URL, verify the listener belongs to that worktree, and run the final viewport sweep against the production build.

## Why It Happened

The E2E configuration intentionally reuses a healthy listener to make normal local runs fast. In a second Git worktree, the default Astra and Composer ports may already belong to another checkout. A route health check proves that an app is listening, but not that it is serving the branch under review. Better Auth also binds its origin to the configured base URL, so a mismatched server can appear as a signed-out or invalid-origin product failure.

## How To Avoid It

1. Before a worktree E2E run, resolve the listener on the intended port and confirm its checkout when possible.
2. Set distinct `ASTRA_E2E_BASE_URL` and `ASTRA_E2E_COMPOSER_BASE_URL` values for the worktree instead of stopping an unrelated developer server.
3. Configure Better Auth, Astra, Composer, and Playwright from those same URLs.
4. Run final responsive acceptance against the production build so hot reload cannot interrupt navigation.
5. Treat a pass from an unknown reused listener as invalid evidence.
