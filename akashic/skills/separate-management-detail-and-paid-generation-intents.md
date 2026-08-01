---
title: "Separate management, detail, and paid-generation intents"
type: "skill"
description: "Keep list management, single-record detail, and paid generation as explicit separate user intents."
status: "active"
project: "astra"
created: "2026-08-01"
date: "2026-08-01"
updated: "2026-08-01"
timestamp: "2026-08-01"
okf_version: "0.1"
tags: ["skill", "captured"]
related: []
---
# Separate management, detail, and paid-generation intents

## Problem
Combining record management, detail inspection, and paid generation on one surface makes the default list feel like a checkout flow and obscures what each action will change or charge for.

## Signals
- The list always renders a generation wizard even when the user only wants to browse or add a record.
- Opening one record repeats the entire list beside the detail.
- Child detail routes lose the owning parent navigation highlight.
- Creating a record silently also creates or charges for a generated artifact.

## Root Cause
A reusable wizard or generic detail page became the route's default content instead of being activated by explicit user intent. URL state, navigation ownership, persistence, and product copy no longer describe the same job.

## Investigation
1. Trace the list CTA, record actions, detail link, wizard initial state, persistence calls, and generation calls.
2. Verify whether the record and its computational basis can be saved without generating the paid artifact.
3. Check route and query state used by desktop and mobile navigation.
4. Inspect empty, invalid-detail, API-error, and logged-out branches before changing the happy path.

## Resolution
1. Keep the default list focused on management and expose one explicit add action.
2. Render creation only after the add action; persist the record and required computational basis, then return to the list without generation.
3. Render a selected detail as one record with a clear back path and canonical parent-navigation context.
4. Start generation only from an explicit action for a saved record; skip already-completed setup steps and retain confirmation at the charge/generation boundary.
5. On a default profile surface, keep the final paid action hidden until the user explicitly advances into generation or follows its deep link; default to reviewing the required inputs.

## Prevention
Add browser tests proving that creation produces no generation request, detail renders no sibling list, parent navigation remains active, and desktop/tablet/mobile have no overflow or console errors. Keep all UI labels in the product i18n dictionary.

## Related Files
- `apps/astra-web/app/allies/page.tsx`
- `apps/astra-web/app/charts/page.tsx`
- `apps/astra-web/app/self/page.tsx`
- `apps/astra-web/components/BirthOnboardingPanel.tsx`
- `apps/astra-web/components/AppNavigation.tsx`
- `apps/astra-web/e2e/foundation-routes.spec.ts`

## Related ADRs
- None yet.
