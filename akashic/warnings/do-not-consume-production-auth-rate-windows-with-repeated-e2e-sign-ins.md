---
title: "Do not consume production auth rate windows with repeated E2E sign-ins"
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
# Do not consume production auth rate windows with repeated E2E sign-ins

## What Happened
Prove one real OTP contract, reuse correctly signed Better Auth test sessions for product journeys, and test production throttling on a separate server where the limiter remains enabled.

## Why It Happened
Repeated OTP sign-ins and harmless session reads across a full viewport matrix
exhausted Better Auth's production request window, producing false 429 failures.

## How To Avoid It
Keep one real OTP contract, use Better Auth-signed test sessions for product
journeys, disable the general window only on the exhaustive Playwright server,
and prove production throttling on an isolated server where it remains enabled.
