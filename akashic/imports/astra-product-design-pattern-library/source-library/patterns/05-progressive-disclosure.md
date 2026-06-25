---
title: "Progressive Disclosure"
slug: "05-progressive-disclosure"
priority: "critical"
astra_area: "ui, education"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: Progressive Disclosure

## Core Principle
Reveal depth in layers so beginners feel safe and experts still find power.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- Basic card first, chart details second
- Beginner/expert toggles
- Advanced filters hidden but discoverable
- Just-in-time explanation

## Avoid
- Dumping all chart jargon upfront
- Burying advanced tools
- Forced tutorials

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `advanced_panel_open_rate`
- `beginner_completion_rate`
- `help_tooltip_rate`
- `dropoff_by_complexity`

## Codex Implementation Direction
Design every major screen with three layers: glance, learn more, expert depth.

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
