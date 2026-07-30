---
title: "Keep TypeScript 6 API beside TypeScript 7 CLI"
type: "warning"
description: "Keep the TypeScript 6 programmatic API available while TypeScript 7 owns the CLI compiler."
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
# Keep TypeScript 6 API beside TypeScript 7 CLI

## What Happened
TypeScript 7.0 can safely accelerate CLI typechecks while tools still import the TypeScript 6 API. Install @typescript/native as an alias of typescript@7 and alias typescript to @typescript/typescript6; verify tsc is 7.x, require('typescript') is 6.x, source coverage is identical, npm ci passes, and the full repo gate passes. Do not force a direct replacement past typescript-eslint peer warnings. Remove the side-by-side layout only after dependent tools explicitly support the TypeScript 7 programmatic API.

## Why It Happened
TypeScript 7.0 ships the native compiler and language tooling without a
programmatic API. Existing tools such as Next.js and `typescript-eslint` still
import the JavaScript TypeScript API and declare compatibility with TypeScript
versions below 6.1.

## How To Avoid It
Use the official side-by-side transition layout. Let TypeScript 7 own the
`tsc` executable, keep TypeScript 6 available as the `typescript` API and
`tsc6`, and validate compiler parity, source coverage, clean installation,
lint, tests, and production build before adoption.
