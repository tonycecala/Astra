---
title: "Vercel env pull cannot recover sensitive local bakeoff secrets"
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
# Vercel env pull cannot recover sensitive local bakeoff secrets

## What Happened
A private Astra OpenRouter bakeoff initially failed because standalone `tsx` scripts do not automatically load Next.js environment files. A production `vercel env pull` did not recover the credential: sensitive values were returned as `[SENSITIVE]`, and sourcing that file replaced a valid database URL with the redacted placeholder.

## Why It Happened
The experiment worktree has no local `.env.local` and is not linked to Vercel. The usable machine-local credential already exists in the canonical Astra app's ignored environment file, but that location was not recorded in the experiment playbook.

## How To Avoid It
For private Astra OpenRouter bakeoffs on Tony's current machine, source `/Users/tony/Documents/Projects/Astra/apps/astra-web/.env.local` in the standalone-script subprocess. Never print the value, copy it into the experiment worktree, or commit it. Do not retry `vercel env pull` as a secret-recovery mechanism. If the canonical local file moves or stops containing the key, report the exact missing-credential blocker instead of searching broadly for secrets.
