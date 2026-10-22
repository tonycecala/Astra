---
title: "Classify Astra buttons by action role before styling"
type: "skill"
description: "Akashic skill artifact."
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
# Classify Astra buttons by action role before styling

## Problem
Inconsistent white or ink-colored buttons obscure the primary action and can make utility or destructive controls look equally important. Recoloring every button gold would replace one hierarchy problem with another.

## Signals
- A primary CTA does not match Astra's established gold treatment.
- Several adjacent actions share the same high-emphasis fill.
- Dark mode turns ink-filled actions white and visually overpowering.
- Ghost or destructive controls inherit the default primary treatment.
- Gold text contrast is assumed rather than measured.

## Root Cause
The shared button class carried layout and an ink-based visual treatment together, while local selectors overrode semantic variants. Components described action priority inconsistently, so theme changes exposed accidental white primary surfaces.

## Investigation
1. Inventory button classes and group each control as primary, secondary, ghost, or destructive.
2. Inspect the shared cascade and higher-specificity component overrides.
3. Identify the one primary action in each decision group before changing CSS.
4. Measure foreground/background contrast in light and dark themes.
5. Verify computed styles and action hierarchy in rendered desktop, tablet, and mobile journeys.

## Resolution
1. Treat bare `.button` as Astra's gold primary action with generous horizontal padding and strong verb-led copy.
2. Use `.secondary`, `.ghost`, and `.dangerButton` explicitly for subordinate, dismissive, and destructive roles.
3. Centralize gold-button text in `--gold-ink` and require at least WCAG AA normal-text contrast.
4. Preserve visible focus, restrained hover, and honest disabled states.
5. Remove local color overrides that flatten a group, then mark its actual primary control in the component.

## Prevention
Add rendered assertions proving primary background/text tokens, padding, light/dark behavior, and adjacent secondary differentiation. Keep lint, typecheck, production build, horizontal-overflow, and console/page-error checks in the affected journey.

## Related Files
- `apps/astra-web/app/globals.css`
- `apps/astra-web/app/self/page.tsx`
- `apps/astra-web/e2e/foundation-routes.spec.ts`
- `akashic/playbooks/astra-composer-product-design-patterns.md`

## Related ADRs
- None yet.
