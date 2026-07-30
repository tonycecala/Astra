---
title: "Browser action acknowledgement is not persisted-state proof"
type: "warning"
description: "Akashic warning artifact."
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
# Browser action acknowledgement is not persisted-state proof

## What Happened
For durable state transitions, assert the action acknowledgement, reload the route, and then assert the persisted result. Client revalidation timing can otherwise make release E2E intermittently fail even when the database update succeeds.

## Why It Happened
The mutation acknowledgement rendered before the client-side Journey list
finished revalidating, so the next card could remain visible briefly even
though the database transition succeeded.

## How To Avoid It
Assert the acknowledgement to prove the action response, reload the route, and
then assert the durable result. Reserve immediate DOM assertions for explicitly
optimistic UI contracts.
