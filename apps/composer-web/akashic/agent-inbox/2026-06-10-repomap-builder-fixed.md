---
title: "REPOMAP Builder Fixed"
status: "new"
date: "2026-06-10"
updated: "2026-06-10"
tags: ["agent-message", "notification"]
related: []
---

# REPOMAP Builder Fixed

## Message
Akashic fixed ak repomap build so app repos no longer inherit Akashic CLI constraints like no UI, database, or auth. Rerun ak repomap build in this repo before relying on local REPOMAP guidance. If the regenerated REPOMAP is useful, commit it locally and run ak ingest /Users/tony/Documents/Projects/Astra/apps/composer-web from central Akashic when the lesson should become shared memory.

## From
- Repository: `/Users/tony/Documents/Projects/Akashic`

## To
- Repository: `/Users/tony/Documents/Projects/Astra/apps/composer-web`

## Handling
- Read this before broad work in the target repo.
- If this message captures reusable knowledge, run `ak capture ...` or `ak learn ...` locally.
- If the knowledge should become central memory, run `ak ingest /Users/tony/Documents/Projects/Astra/apps/composer-web` from `/Users/tony/Documents/Projects/Akashic`.
