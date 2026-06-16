---
title: "Timezone fields should use constrained IANA selection"
status: "active"
date: "2026-06-15"
updated: "2026-06-15"
tags: ["warning", "captured"]
related: []
---
# Timezone fields should use constrained IANA selection

## What Happened
When collecting birth data in Astra, do not ask humans to type an implementation-shaped timezone string. Use a constrained IANA timezone picker/select, submit the exact IANA value such as America/New_York, and fail early if the runtime cannot provide the standard timezone list. This keeps birth date as the minimum while preserving the optional birth time + timezone + location precision bundle.

## Why It Happened
A chart request form originally used a plain text timezone field. That exposed an internal IANA value shape to humans and made it easy to submit partial or malformed precision data even though birth time, timezone, and location travel as one optional precision bundle.

## How To Avoid It
Use a native select or equivalent searchable picker backed by standard IANA timezone values. Keep the stored/submitted value exact, for example `America/New_York`, while presenting readable labels. If the runtime cannot provide the standard timezone list, fail clearly instead of accepting free-form timezone text.
