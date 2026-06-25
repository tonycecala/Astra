---
title: "Discovery"
slug: "03-discovery"
priority: "critical"
astra_area: "stream, composer"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: Discovery

## Core Principle
Guide users to value before they know what to search for.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- Composer-driven next-best cards
- Transit/context recommendations
- Popular beginner paths
- Related Library prompts

## Avoid
- Firehose feed
- Search-only UX
- Too many suggestions at once

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `cards_opened_per_session`
- `suggestion_click_rate`
- `feature_discovery_rate`
- `return_after_discovery`

## Codex Implementation Direction
Treat Composer as a discovery engine, not a content feed. Every suggestion needs a reason, a timing context, and a next action.

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
