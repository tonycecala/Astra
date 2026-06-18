---
title: "Composer generated image binaries stay out of git"
status: "active"
date: "2026-06-17"
updated: "2026-06-17"
tags: ["warning", "captured"]
related: []
---
# Composer generated image binaries stay out of git

## What Happened
When quarrying v1 Composer or building large card libraries, commit card metadata, prompts, remote image URLs, and deterministic import/check scripts, but do not commit generated image binaries under apps/composer-web/public/generated or similar asset dumps. Add explicit .gitignore coverage and a smoke/check that fails if generated image binaries are tracked by git. This keeps the repo light while preserving the workflow and cache boundary for future 100k-card scale.

## Why It Happened
Composer quarry work can involve hundreds or eventually 100k+ generated cards. It is tempting to copy the visible image folder along with the card metadata, but generated media binaries bloat the repository, make reviews noisy, and blur the cache/storage boundary. The durable source of truth for this slice is the card metadata, prompts, remote image URLs, and verification scripts.

## How To Avoid It
- Add explicit `.gitignore` coverage for generated media directories before copying or syncing quarry assets.
- Keep card/image metadata in JSON/CSV fixtures or migrations, not binary media files.
- Add a smoke/check that inspects `git ls-files` and fails if generated image extensions are tracked in Composer media paths.
- Use remote image URLs, object storage, or a local ignored cache for preview media.
- Before handoff, run `git ls-files | rg '\\.(png|jpg|jpeg|gif|webp|avif)$'` and confirm no generated Composer media binaries are tracked.
