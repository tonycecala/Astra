# Astra Alpha Route Parity Progress

## `/self`

- Status: patched and ready for QA.
- V1 quarry note: production Self is a private profile home with avatar/name/birth summary, chart access, portrait/report creation, birth-detail editing, and timeline-style links into chart/report artifacts.
- V2 inventory: signed-out gating, Self profile summary, chart anchor, Stars/onboarding cards, report lifecycle cards, and the birth/report onboarding module already exist.
- Patch: kept the current v2 flow, restored the admin action as the fourth profile action, changed recent report status display to app labels such as `Written`, and linked written report requests back into Library.
- Boundary: no Supabase assumptions or new parser/report behavior introduced.

## `/library`

- Status: patched and ready for QA.
- V1 quarry note: production Library supports a saved report list, report-family filters, full report detail, report actions, feedback, admin metadata, and direct `/library/:id` links.
- V2 inventory: list filters/search, lightweight report cards, selected report reader, share/copy/download/print/delete, feedback, chart plate, and admin debug details already exist.
- Patch: kept the single v2 reader path, changed report-card status display from raw engine values to app labels such as `Written`, and added a v1-style `/library/:id` redirect into the existing reader.
- Boundary: no duplicate report reader, no new persistence, no Supabase assumptions.

## `/allies`

- Status: patched and ready for QA.
- V1 quarry note: production Allies is a relationship roster with clear records, chart readiness, portrait/report access, and actions to continue the relationship path.
- V2 inventory: signed-out gating, Ally records, Ally birth/report onboarding, chart request creation, report generation, Synastry selection, and Library handoff already exist.
- Patch: kept the current v2 onboarding module, upgraded saved Ally cards with chart/report status and direct actions to chart, portrait, or birth details.
- Boundary: no invite system, no duplicate Ally detail route, no Supabase assumptions.
