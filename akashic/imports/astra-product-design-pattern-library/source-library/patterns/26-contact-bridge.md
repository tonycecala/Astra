---
title: "Contact Bridge"
slug: "26-contact-bridge"
priority: "dangerous"
astra_area: "social, privacy"
source: "The Product Design Playbook, flattened text upload"
status: "codex-ready"
---

# Astra Pattern Skill: Contact Bridge

## Core Principle
Connect with existing networks only if trust and utility justify the ask.

## Astra Translation
This pattern should be interpreted through Astra’s product frame:

- **Home / Stream**: daily relevance and discovery.
- **Allies**: supportive relationships, mentors, archetypes, guides.
- **Self**: chart, preferences, reflections, identity signals.
- **Library**: durable artifacts and personal archive.
- **Gifts**: earned milestones, stars, constellations, certificates.

## Use In Astra
- Optional friend discovery
- Manual invite first
- Clear privacy preview

## Avoid
- Early contact sync
- Uploading contacts silently
- Social pressure loops

## Product Questions
- Where does this pattern reduce friction without reducing meaning?
- Does it increase clarity, trust, momentum, or personal relevance?
- Does it respect the user’s autonomy?
- Could a new user understand the value without a tutorial?
- Would this still feel good after 30 days of use?

## Metrics To Instrument
- `contact_permission_rate`
- `invite_quality`
- `privacy_complaints`

## Codex Implementation Direction
For Astra, contacts are sensitive. Default to manual invites unless a strong social feature exists.

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
