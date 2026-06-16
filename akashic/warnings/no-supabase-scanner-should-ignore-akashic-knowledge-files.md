---
title: "No-Supabase scanner should ignore Akashic knowledge files"
status: "acted"
date: "2026-06-15"
updated: "2026-06-15"
tags: ["warning", "captured"]
related: []
---
# No-Supabase scanner should ignore Akashic knowledge files

## What Happened
Astra's no-Supabase check should scan runtime/source/config surfaces for forbidden legacy carryover, but Akashic handoffs and warnings are knowledge artifacts and may quote terms like RLS while explaining what not to do. Keep akashic/ in the documentation skip list so active inbox guidance cannot make validation fail before work starts.

## Why It Happened
TBD

## How To Avoid It
TBD
