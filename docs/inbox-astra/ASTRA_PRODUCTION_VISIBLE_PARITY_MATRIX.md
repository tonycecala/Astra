---
title: "Astra Production Visible Parity Matrix"
type: "parity-checklist"
project: "Astra Clean Start"
status: "active"
priority: "P0"
created: "2026-06-23"
source_of_truth:
  - "/Users/tony/Documents/Projects/Astria/app"
  - "/Users/tony/Documents/Projects/Astra/apps/astra-web/app"
scope: "Visible production Astra capability parity only. No new features, architecture changes, or optimization."
---

# Astra Production Visible Parity Matrix

Goal: restore v2 parity in Tony's priority order. Status values are `Exists`, `Missing`, `Partial`, or `Broken`.

## 1. Authentication

- [x] `Exists` - Login route exists in v2 at `/login`.
- [x] `Exists` - Better Auth email-code controls are visible and covered by route smoke.
- [x] `Exists` - Signed-out Self route gates private profile/chart data.
- [ ] `Partial` - v1 had separate forgot/reset/signup/account routes. v2 has the alpha email-code path only.

## 2. Onboarding

- [x] `Exists` - Self onboarding can queue chart and report requests.
- [x] `Exists` - Birth place search and timezone selection are present.
- [x] `Exists` - Current v2 flow now presents `Your name`, `Birth Details`, and `Report` instead of SaaS-style precision-first copy.
- [ ] `Partial` - v1 had broader person/ally creation routes and chart-setting choices; v2 clean-start onboarding covers the Self path first.
- [ ] `Partial` - Date/time entry is usable but still not at the approved durable birth-data flow quality.

## 3. Reports

- [x] `Exists` - v2 can create a report request and generate a report result from Self onboarding.
- [x] `Exists` - Report output is saved and opened from Library.
- [x] `Exists` - Report status copy now says `Written` instead of `Ready`.
- [ ] `Partial` - v1 production had richer report families, admin replay/query/bakeoff, and report debug surfaces than this branch currently exposes.
- [ ] `Missing` - Production-style report actions such as share, markdown download, copy, print, delete, and feedback are not visible in this branch.

## 4. Library

- [x] `Exists` - `/library` lists artifacts and can open a selected report by `reportId`.
- [x] `Exists` - Library list stays lightweight and does not render the full report body in the list.
- [ ] `Partial` - v1 production Library had richer filters/search/detail actions.
- [ ] `Missing` - Shared report route parity is not visible in this branch.

## 5. Journey Feed

- [x] `Exists` - `/journey` renders public fallback cards and private empty state.
- [x] `Exists` - Lane filters, card detail, save, and reflect actions are visible.
- [ ] `Partial` - v1 production feed/events/notifications depth is not fully restored.
- [ ] `Partial` - Composer-selected and private Journey paths exist as clean-start states, but production-level lifecycle parity still needs route QA after the Composer availability work lands.

## 6. Self Page

- [x] `Exists` - `/self` has signed-out gating, signed-in profile summary, Stars, onboarding, chart anchor, and recent request/report status rails.
- [x] `Exists` - Profile actions use i18n labels.
- [ ] `Partial` - v1 chart home/detail depth is not fully visible from this branch's Self page.
- [ ] `Partial` - Full account/settings/profile route parity is outside the current Self page.

## 7. Gifts

- [x] `Exists` - `/gifts` route exists and displays Stars/transaction framing.
- [ ] `Partial` - v1 production had `/stars`, `/credits`, checkout, and ledger-backed purchase/spend flows. This branch has visible gift framing but not complete production Stars parity.
- [ ] `Missing` - Stripe hosted checkout browser-visible parity is not present in this branch.

## 8. Admin Tooling

- [ ] `Missing` - v1 production `/admin` route is not present in this branch.
- [ ] `Missing` - Admin report replay/query/bakeoff controls are not visible in this branch.
- [ ] `Missing` - Admin ledger, feedback, and report debug visibility are not visible in this branch.

## Next Restoration Order

1. Authentication: keep current email-code path unless production account routes become alpha-required.
2. Onboarding: finish Self flow QA, then port Ally/person onboarding parity without adding new architecture.
3. Reports: restore v1 visible report actions and admin-only report debug affordances.
4. Library: restore v1 filters/search and shared/detail affordances.
5. Journey feed: verify Composer availability output reaches the intended v2 Journey surfaces.
6. Self page: restore chart home/detail reachability from Self/Allies.
7. Gifts: restore Stars/checkout/ledger route parity.
8. Admin tooling: restore v1 admin query/debug/bakeoff and ledger controls.
