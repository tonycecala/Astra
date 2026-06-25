---
title: "Sandbox Experience"
slug: "02-sandbox-experience"
priority: "critical"
astra_area: "onboarding, conversion"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: Sandbox Experience

## Core Principle
Let people feel Astra before they commit.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- Public demo Stream
- Sample explorer profile
- Sample Library with reports/gifts/certificates
- Gate save/personalize/share, not viewing

## Avoid
- Fake demo that overpromises
- Blank sandbox
- Signup before curiosity exists

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `anonymous_sandbox_start_rate`
- `sandbox_to_signup_rate`
- `sample_report_open_rate`

## Codex Implementation Direction
Create a no-auth Astra sandbox using representative sample chart data, sample allies, sample Library, and a visible 'make this mine' conversion path.

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
