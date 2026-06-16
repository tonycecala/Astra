---
title: "Preventable implementation hiccups from Composer private-feed workflow"
status: "active"
date: "2026-06-16"
updated: "2026-06-16"
tags: ["warning", "captured"]
related: []
---
# Preventable implementation hiccups from Composer private-feed workflow

## What Happened
During the 2026-06-16 Composer private-feed workflow, several small avoidable hiccups slowed the session:

- `zsh` expanded square brackets in App Router paths, so unquoted paths like `apps/astra-web/app/api/reports/[requestId]/publish-signal/route.ts` failed with `no matches found`.
- A quick no-cookie HTML check assumed `python` existed; this machine needed `python3` or the bundled workspace Python path.
- The browser automation session had persistent top-level bindings, so redeclaring `setupBrowserRuntime` caused an identifier redeclaration error.
- Browser viewport reset was attempted with `clear()`, but the actual capability method is `reset()`.
- A Playwright assertion used broad text matching for `Public fallback` / `Private journey`; strict mode failed because those labels appeared in repeated card metadata as well as the status strip.
- A response-shape change in the report smoke left a stale `userId` variable; `typecheck` caught it before runtime.
- `git diff --check` caught trailing markdown whitespace in `docs/progress/PROGRESS_LOG.md`.
- The foundation checker initially asserted old implementation strings after report publishing moved to the shared private-feed contract/service.

## Why It Happened
These were not product architecture failures. They were small workflow mismatches between repo conventions, shell behavior, browser-tool behavior, and changed test invariants. Most appeared when moving quickly across route paths, browser verification, and smoke-test response shapes.

## How To Avoid It
- Quote any path containing App Router brackets in shell commands.
- Prefer `python3` or the bundled workspace Python executable for quick scripts.
- In node-backed browser sessions, reuse existing `browser` / `tab` bindings or choose fresh variable names instead of redeclaring top-level constants.
- Read browser capability docs before using less-common capability methods; viewport reset is `reset()`.
- Scope Playwright text assertions to stable containers such as `.status-strip` when labels may repeat in cards or metadata.
- Run `npm run typecheck` early after changing API response shapes or smoke assertions.
- Run `git diff --check` before staging.
- When replacing an implementation path, update foundation checks to assert the new invariant, not the old helper/function name.
