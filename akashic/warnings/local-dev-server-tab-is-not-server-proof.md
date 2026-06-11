---
title: "Local dev server tab is not server proof"
status: "active"
date: "2026-06-11"
updated: "2026-06-11"
tags: ["warning", "captured"]
related: []
---
# Local dev server tab is not server proof

## What Happened
A browser tab on localhost does not prove the Next.js dev server is still running. In Astra, the in-app browser remained on http://localhost:3011/login after the dev server had stopped, so the page looked like a stale app state. Before UI review or handoff, verify the port with lsof -nP -iTCP:<port> -sTCP:LISTEN or a real page reload. Fix by restarting the app with npm run dev from /Users/tony/Documents/Projects/Astra and confirming Next reports Ready on port 3011.

## Why It Happened
Long local sessions can leave an in-app browser tab showing the last successful page even after the underlying Next.js process exits. On agent platforms, a foreground `npm run dev` process is attached to the terminal/tool session that started it, so compaction, interruption, cleanup, or closing the session can stop the server while the browser tab remains open. Earlier temporary auth smoke work also used separate ports and explicit cleanup, so it became especially important to verify the actual listening port rather than trusting the visible tab.

## How To Avoid It
- Before saying a local app is running, check the port with `lsof -nP -iTCP:<port> -sTCP:LISTEN`.
- If the port is empty, restart from the repo root with the durable launcher, such as `npm run dev:up` for Astra.
- After restart, confirm the framework reports ready on the expected port and reload the browser route.
- Keep temporary smoke servers on separate ports and stop only those ports, not the user's active app server.
