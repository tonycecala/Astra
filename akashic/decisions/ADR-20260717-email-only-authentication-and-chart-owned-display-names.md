---
title: "Email-only authentication and chart-owned display names"
type: "decision"
description: "Akashic decision artifact."
status: "proposed"
project: "akashic"
created: "2026-07-17"
date: "2026-07-17"
updated: "2026-07-17"
timestamp: "2026-07-17"
okf_version: "0.1"
tags: ["adr", "captured"]
related: []
---
# ADR: Email-only authentication and chart-owned display names

## Date
2026-07-17

## Status
Proposed

## Decision
Better Auth email OTP only needs an email for sign-in and registration. Astra collects a person’s display name at first Self chart creation, where it names the chart, then persists that value to both the Better Auth user and Astra profile only when the profile still uses its email fallback. Do not prompt returning users for a name on login.

## Context
TBD

## Alternatives
TBD

## Consequences
TBD
