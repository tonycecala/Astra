---
title: "Time to Value"
slug: "01-time-to-value"
priority: "critical"
astra_area: "onboarding, activation"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: Time to Value

## Core Principle
Collapse the distance between first contact and first meaningful Astra insight.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- Stream preview before signup
- Sample chart/portrait sandbox
- First personal insight within 60 seconds
- Delay account walls until peak curiosity

## Avoid
- Long tours before insight
- Dashboard-first blank state
- Asking for every preference before value

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `visitor_to_first_card_seconds`
- `birth_data_to_first_insight_seconds`
- `activation_rate`
- `onboarding_step_dropoff`

## Codex Implementation Direction
Build onboarding backwards from Astra’s aha moment: a personally relevant symbolic insight that makes the user say, “that feels like me.”

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
