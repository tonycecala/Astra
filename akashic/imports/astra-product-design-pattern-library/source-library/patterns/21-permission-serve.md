---
title: "Permission Serve"
slug: "21-permission-serve"
priority: "high"
astra_area: "notifications, contacts"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: Permission Serve

## Core Principle
Ask for access only when the user understands the benefit.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- Notifications after daily ritual chosen
- Contacts only when inviting Allies/friends is useful
- Calendar only for transit reminders

## Avoid
- Permission on app launch
- Vague 'improve experience' copy
- Stacked permission prompts

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `permission_grant_rate`
- `permission_prompt_dismiss_rate`
- `retention_by_permission`

## Codex Implementation Direction
Never ask for permission as a system need. Offer it as a user benefit.

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
