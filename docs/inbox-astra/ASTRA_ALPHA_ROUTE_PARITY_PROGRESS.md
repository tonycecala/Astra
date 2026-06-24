# Astra Alpha Route Parity Progress

## `/self`

- Status: patched and ready for QA.
- V1 quarry note: production Self is a private profile home with avatar/name/birth summary, chart access, portrait/report creation, birth-detail editing, and timeline-style links into chart/report artifacts.
- V2 inventory: signed-out gating, Self profile summary, chart anchor, Stars/onboarding cards, report lifecycle cards, and the birth/report onboarding module already exist.
- Patch: kept the current v2 flow, restored the admin action as the fourth profile action, changed recent report status display to app labels such as `Written`, and linked written report requests back into Library.
- Boundary: no Supabase assumptions or new parser/report behavior introduced.
