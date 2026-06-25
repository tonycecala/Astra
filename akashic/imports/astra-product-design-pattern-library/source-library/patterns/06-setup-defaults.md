---
title: "Setup Defaults"
slug: "06-setup-defaults"
priority: "high"
astra_area: "onboarding, empty states"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: Setup Defaults

## Core Principle
Hand users a useful starting point instead of an empty system.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- Starter Stream
- Suggested first Ally
- Default course path
- Sample Library artifacts

## Avoid
- Rigid defaults
- Too many template options
- Unexplained prefill

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `default_accept_rate`
- `default_edit_rate`
- `setup_completion_rate`

## Codex Implementation Direction
Use defaults as scaffolding, not control. Make them editable, skippable, and visibly helpful.

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
