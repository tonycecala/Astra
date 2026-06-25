---
title: "System Widget"
slug: "22-system-widget"
priority: "high"
astra_area: "mobile retention"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: System Widget

## Core Principle
Surface live, glanceable value outside the app.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- Daily transit widget
- Star/gift status
- Current course prompt
- Moon phase + personal note

## Avoid
- Marketing widget
- Dense chart data
- Static stale content

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `widget_install_rate`
- `widget_retention_lift`
- `widget_tapthrough_rate`

## Codex Implementation Direction
An Astra widget must earn home-screen real estate by being timely, personal, and calm.

## Acceptance Criteria
- The UX state has a clear before / during / after.
- Empty, loading, success, error, and logged-out states are accounted for.
- Mobile layout works first.
- Copy is user-outcome focused, not system-focused.
- Analytics events are named and documented.
- No dark-pattern implementation.
- Edge cases are tested.

## Notes For Astra
Astra should adapt this play through a mythic, humane, and non-extractive lens. The goal is not maximum compulsion. The goal is durable usefulness, calm return, meaningful progress, and a sense that the product remembers the user’s becoming.
