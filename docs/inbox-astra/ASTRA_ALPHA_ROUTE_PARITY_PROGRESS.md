# Astra Alpha Route Parity Progress

## 2026-06-24 Progress Update

- Alpha shell: kept the app on the current v2 shell while restoring v1-critical behavior directly from quarry notes/code. No Supabase assumptions were reintroduced.
- Mobile/tailnet: verified the app over the iPhone/Tailscale path, added the local tailnet dev origin, fixed sign-in/session behavior over that path, and kept mobile gutters tight.
- Visual system: captured the reusable compact list pattern for Allies and Library rows: Astra-gold title, softened type pill, quiet metadata line, icon-only actions, minimal inter-row spacing, and placeholder-only search/filter chrome.
- Self: restored the four-action admin Self card, wired Gravatar into both profile and topbar avatars, fixed light-mode birth-data contrast, and preserved birth/report onboarding.
- Allies: imported private v1 people without public-figure pollution, made chart/report creation prefill known birth data, compacted the roster, added search/filter, and added confirmed Ally removal without deleting related reports.
- Library/reports: made report rows match the Ally list style, kept list rows lightweight, retained full report rendering in detail, restored v1 report actions, and surfaced v1 LLM writer/tokens/cost/latency metadata in the admin debug drawer.
- Admin: preserved the stronger admin ledger/report tooling, made `astramaster@tony.io` an admin, kept advanced report controls admin-only, and restored exact report replay/debug lookup outside the recent-run window.
- Stars/Gifts: restored Stripe sandbox price compatibility, kept ledger behavior separate from Gifts, tightened Gift panels, changed the Star entry point to `Get Stars`, and kept Gift productization honest for alpha.
- Charts: kept `/charts` as the chart home under Self/Allies rather than a main tab, with full v1-style chart rendering, selectable bodies/aspects, and chart settings visible.

## `/self`

- Status: patched and browser-verified.
- V1 quarry note: production Self is a private profile home with avatar/name/birth summary, chart access, portrait/report creation, birth-detail editing, and timeline-style links into chart/report artifacts.
- V2 inventory: signed-out gating, Self profile summary, chart anchor, Stars/onboarding cards, report lifecycle cards, and the birth/report onboarding module already exist.
- Patch: kept the current v2 flow, restored the admin action as the fourth profile action, changed recent report status display to app labels such as `Written`, linked written report requests back into Library, wired Gravatar for the profile/topbar avatars, and fixed light-mode birth-data contrast.
- Boundary: no Supabase assumptions or new parser/report behavior introduced.

## `/library`

- Status: patched and browser-verified.
- V1 quarry note: production Library supports a saved report list, report-family filters, full report detail, report actions, feedback, admin metadata, and direct `/library/:id` links.
- V2 inventory: list filters/search, lightweight report cards, selected report reader, share/copy/download/print/delete, feedback, chart plate, and admin debug details already exist.
- Patch: kept the single v2 reader path, removed redundant `Written` status pills from report cards, carried the compact Ally-row style into reports, kept birth data on the second line, restored v1 report metadata in the admin debug drawer, and added a v1-style `/library/:id` redirect into the existing reader.
- Boundary: no duplicate report reader, no new persistence, no Supabase assumptions.

## `/allies`

- Status: patched and browser-verified.
- V1 quarry note: production Allies is a relationship roster with clear records, chart readiness, portrait/report access, and actions to continue the relationship path.
- V2 inventory: signed-out gating, Ally records, Ally birth/report onboarding, chart request creation, report generation, Synastry selection, and Library handoff already exist.
- Patch: kept the current v2 onboarding module, upgraded saved Ally cards with direct icon actions to chart, portrait, birth details, and removal; prefills known birth data and jumps directly to report selection; added confirmed Ally removal without deleting related reports.
- Design note: the current compact Ally card pattern is reusable for report/library rows: single-line title plus softened type pill, birth/metadata as one quiet second line, icon-only right actions, 3px list gap, no redundant status pills, and a placeholder-only `list-filter-bar` search/filter strip.
- Boundary: no invite system, no duplicate Ally detail route, no Supabase assumptions.

## `/journey`

- Status: inventoried and verified; no code patch needed.
- V1 quarry note: production Journey required an app user and rendered the personalized Astra home stream.
- V2 inventory: Journey renders a public preview for signed-out readers, private user-owned cards for signed-in users, Composer-selected cards when explicitly requested, lane filters, card detail, save/reflect UI, and clear public/private state copy.
- Patch: none. The v2 public preview is an intentional alpha boundary, not a missing v1 feature.
- Boundary: private feed data remains user-owned and gated; public fallback cards are not copied into private Journey.

## `/gifts`

- Status: patched and browser-verified.
- V1 quarry note: production Gifts was signed-in, intentionally coming soon, and avoided presenting gift checkout as ready before the product lane was complete.
- V2 inventory: `/stars` now owns alpha checkout/balance behavior; `/gifts` was still showing foundation/sample gift and transaction cards.
- Patch: removed foundation sample transactions, gated Gifts behind sign-in, kept an honest gift placeholder, styled Gift panels with the compact-card family while leaving more copy room, uppercased eyebrows, and renamed the purchase entry point to `Get Stars`.
- Boundary: no gift checkout or redemption tables added; no fake ledger surface remains on Gifts.

## `/admin`

- Status: patched and browser-verified.
- V1 quarry note: production admin exposed credit/ledger operations, report query/debug/replay controls, bakeoff affordances, feedback visibility, and role/admin fencing.
- V2 inventory: admin access gate, credit user search, precise ledger table, manual grant/revoke, role management, feedback inbox, report inspector, replay controls, model profile/provider/model overrides, validation/debug details, and Library links already exist.
- Patch: restored v1 LLM writer/provider/model/profile/prompt/tokens/spend/latency metadata in the report debug drawer, preserved exact replay lookup outside the recent-run window, and confirmed `astramaster@tony.io` as an admin user.
- Boundary: advanced report/model controls remain admin-only; customer report creation remains fenced to paid alpha-safe choices.

## `/charts`

- Status: previously restored and verified in final route sweep.
- V1 quarry note: production charts provided the saved chart home, full wheel, legend, selectable bodies, highlighted aspects, chart settings, and report creation entry points.
- V2 inventory: `/charts` exists outside the main tab, opens saved Self/Ally charts in place, renders the full chart wheel with selectable bodies/aspects, preserves Tropical/Sidereal and Whole Sign/Placidus settings, and links chart records back into report creation and Library flows.
- Patch: none in this slice.
- Boundary: charts stay under Self/Allies and `/charts`, not as a main tab.

## `/stars`

- Status: previously restored and browser-verified.
- V1 quarry note: Stars/credits used explicit ledger accounting and Stripe checkout in test/sandbox mode for alpha.
- V2 inventory: `/stars` shows signed-in/signed-out balance state, Star packs, robust checkout panel, Stripe session creation, and webhook fulfillment plumbing; `/admin` owns ledger inspection and adjustments.
- Patch: restored sandbox Stripe price env compatibility and kept hosted checkout/webhook behavior intact for alpha testing.
- Boundary: checkout remains in Stripe test mode and ledger accounting stays separate from Gifts.

## `/login`, `/`, Disabled Help/Settings

- Status: verified in final route sweep.
- V1 quarry note: auth gated private routes and app shell utility controls should not produce broken navigation.
- V2 inventory: `/login` code flow renders, `/` mirrors Journey, private routes redirect or gate correctly, and Help/Settings controls are visibly disabled rather than linked to missing routes.
- Patch: none.
- Boundary: no new settings/help surfaces added for alpha.
