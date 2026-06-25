---
title: "Intent Mirroring"
slug: "13-intent-mirroring"
priority: "high"
astra_area: "composer, ui"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: Intent Mirroring

## Core Principle
Reflect behavior in real time to feel helpful rather than static.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- If user opens relationship cards, suggest relationship path
- If user abandons report, offer sample preview
- If user repeats filter, save it

## Avoid
- Popups too early
- Assuming one click equals identity
- Dark-pattern urgency

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `mirrored_nudge_ctr`
- `nudge_dismiss_rate`
- `task_completion_after_nudge`

## Codex Implementation Direction
Only mirror high-confidence patterns. A bad mirror feels creepy; a good one feels like guidance.

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
