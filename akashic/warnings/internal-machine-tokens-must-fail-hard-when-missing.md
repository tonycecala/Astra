---
title: "Internal machine tokens must fail hard when missing"
status: "active"
date: "2026-06-15"
updated: "2026-06-15"
tags: ["warning", "captured"]
related: []
---
# Internal machine tokens must fail hard when missing

## What Happened
Internal Astra machine-to-machine APIs such as chart-result and Composer artifact ingestion must require ASTRA_INTERNAL_API_TOKEN in every environment. Do not hide local defaults in runtime code or smoke scripts. Put local dummy values in ignored app-local env files, and let missing configuration throw a clear error.

## Why It Happened
A local fallback token made internal machine-to-machine API routes appear configured even when the app process had not loaded `ASTRA_INTERNAL_API_TOKEN`. Once the fallback was removed, the chart-result API correctly failed hard and revealed that the token belonged in the app-local ignored env file for the workspace Next app.

## How To Avoid It
Require the internal token in runtime code and in smoke scripts. Local development can use an ignored `.env.local` value, but code should not invent a default token. A missing token should produce a clear configuration error before any chart-result or Composer-ingest write is accepted.
