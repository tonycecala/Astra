---
title: "REPOMAP Builder Fixed"
status: "new"
priority: "high"
type: "warning"
from: "/Users/tony/Documents/Projects/Akashic"
to: "/Users/tony/Documents/Projects/Astra/apps/composer-web"
created: "2026-06-10"
date: "2026-06-10"
updated: "2026-06-10"
tags: ["agent-message", "notification", "warning", "high"]
related: []
---

# REPOMAP Builder Fixed

## Message
Rerun ak repomap build before trusting the local map. The builder was fixed so app repos no longer inherit Akashic CLI-only priorities like no UI/database/auth. Treat auth, database, and UI as repo-specific product concerns unless the local repo says otherwise.

## From
- Repository: `/Users/tony/Documents/Projects/Akashic`

## To
- Repository: `/Users/tony/Documents/Projects/Astra/apps/composer-web`

## Handling
- Read this before broad work in the target repo.
- Acknowledge, act, explicitly defer, supersede, or close this message by updating the frontmatter `status`.
- Valid statuses: `new`, `acknowledged`, `acted`, `deferred`, `superseded`, `closed`.
- If this message captures reusable knowledge, run `ak capture ...` or `ak learn ...` locally.
- If the knowledge should become central memory, run `ak ingest /Users/tony/Documents/Projects/Astra/apps/composer-web` from `/Users/tony/Documents/Projects/Akashic`.
