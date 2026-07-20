---
title: "JourneyStep Product Model"
status: "accepted"
updated: "2026-07-20"
---

# JourneyStep Product Model

Journey is the private, ordered place where Astra gives a signed-in user the next meaningful thing to notice or do. It renders one current `JourneyStep`, a compact ordered queue, and a saved-for-later list. Signed-out `/` is a public product illustration; signed-out `/journey` redirects to login.

## Contract and ordering

`UserFeedItem` is the durable user-owned projection. No schema change is required. Available items are ordered by `rankScore` descending and `availableAt` ascending; the first is current and the remainder are Up next. Saved items are separate from the active queue.

Actions map to existing persistent states and timestamps:

- Complete -> `seen` and `seenAt`.
- Save for later -> `saved` and `savedAt`.
- Dismiss -> `dismissed` and `dismissedAt`.
- Restore -> `available`, clearing prior action timestamps.

Every read and mutation is scoped by both `userId` and feed-item ID. Journey never exposes Composer decision traces, ranking scores, model details, or another user's projection.

## Product states and pattern acceptance

The rendered states are signed-out illustration, loading, private empty, one step, multiple ordered steps, saved steps, action failure, and database failure. The implementation follows `01-time-to-value.md` (one current focus), `05-progressive-disclosure.md` (queue secondary to the current step), `20-fail-safe.md` (disabled pending actions, retained data, retry), and `36-trust-building.md` (explicit private boundary and only durable actions). No forbidden or adversarial pattern is used.

Analytics are N/A in this iteration because Astra has no active client analytics transport. The durable database state remains the source of truth; no silent telemetry sink was invented.

## Surface ownership

Journey owns sequence and the next action. Library owns reports and durable artifacts. Self owns the user's chart and profile. Allies owns relationship records. Gifts owns granted value. Composer proposes private feed items across its existing contract; Astra alone renders and persists user actions.
