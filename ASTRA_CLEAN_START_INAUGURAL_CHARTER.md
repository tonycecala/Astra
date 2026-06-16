# ASTRA CLEAN START INAUGURAL CHARTER

**Date:** 2026-06-01  
**Project:** Astra Clean Start  
**Audience:** Codex / engineering agents / future maintainers  
**Status:** Foundational direction document  

---

## 1. The Decision

We are starting a new Astra project/repo.

This is **not** a migration of the old Astra codebase.
This is **not** a drag-forward cleanup.
This is **not** a salvage operation where every historical artifact comes along for the ride.

This is a clean rebuild of Astra as a lean, modular symbolic reader with a small number of durable product primitives. "RSS-like" describes a calm card-reading interaction pattern, not a public broadcast data model.

The old repo becomes a **quarry**.
The new repo becomes the **cathedral**.

We will extract only what has proven value.
We will leave behind accumulated entropy.

---

## 2. Product North Star

Astra is becoming a symbolic operating system for the self, but the first implementation should stay radically simple.

At launch, Astra should behave more like a beautiful, meaningful, personalized stream reader than a sprawling SaaS platform.

Astra is not a newspaper. Composer privately assembles each user's next meaningful card from public source material, personal state, timing, progress, and explicit permissions.

Core metaphor:

> Astra is a living stream of meaningful cards, reflections, achievements, allies, artifacts, and gifts.

The user should experience Astra as:

- light
- fast
- personal
- symbolic
- useful
- calm
- modular
- legible
- spiritually resonant without becoming vague or bloated

The internal engineering experience should mirror the product experience:

- small modules
- clear contracts
- low coupling
- minimal side effects
- easy local reasoning
- easy agent reasoning
- no haunted dependency graph

---

## 3. What Astra Is Now

Astra is being rewritten as a lean reader/account system with these core areas:

| Area | Description |
|---|---|
| Stream | Private, personalized user feed for symbolic, reflective, useful content; public/shared cards are source or fallback material only |
| Self | User account/home area with identity, progress, and personal state |
| Achievements | Record of meaningful actions, milestones, streaks, and earned symbolic progress |
| Allies | List of people, guides, archetypes, ancestors, mentors, or symbolic companions |
| Artifacts / Library | Saved reports, generated items, reflections, notes, cards, studies, and meaningful documents |
| Gifts | Store/reward/value layer where stars/tokens can be earned, purchased, spent, or accounted for |
| Stars | Symbolic value unit that tested well and should cross over cleanly |

The app should not begin as a giant astrology platform.
It should begin as a clean symbolic reader with astrology/code primitives available as modules.

---

## 4. Explicit Non-Goals

Do **not** recreate the old repo structure.
Do **not** import old clutter.
Do **not** preserve dead PNG files, experimental assets, abandoned UI branches, or historical scaffolding.
Do **not** migrate Supabase state.
Do **not** carry Supabase assumptions into the new app.
Do **not** build migrations for old data.
Do **not** keep legacy abstractions just because they exist.
Do **not** let Composer logic leak into the user-facing Astra app.
Do **not** build the whole cathedral before the first chapel stands.

This project should start clean, empty, and strongly bounded.

---

## 5. Database Doctrine

We are starting with empty databases.

There is no legacy data migration requirement.
There is no Supabase carryover requirement.
There is no old user/account/report migration requirement.

Preferred posture:

```txt
Clean database.
Clean schema.
Small tables.
Typed access.
Seedable dev data.
Repeatable local setup.
No accidental production coupling.
```

The user is explicitly migration-averse because previous complexity accumulated through flawless-seeming additions that later entangled the system.

Therefore:

- prefer clean schema design over compatibility layers
- prefer resettable development databases over fragile migrations during early build
- prefer seed scripts over historical migration chains while the product shape is still forming
- introduce migrations only when the schema has stabilized enough to justify them
- keep production, preview, and local databases physically and logically separated

---

## 6. Supabase Boundary

Supabase does not cross over.

The new Astra project should not inherit Supabase-era assumptions, roles, RLS conventions, auth tables, policy naming, client wrappers, or environment variables unless explicitly reapproved.

If authentication, storage, or database services are needed, choose them intentionally for the new architecture.

No hidden Supabase fossils.
No compatibility shims unless deliberately justified.
No “temporary” bridge that becomes permanent architecture.

---

## 7. Extraction Doctrine

We are not migrating Astra.
We are extracting proven Astra value.

Allowed extraction candidates:

- astrology calculation code that works
- chart primitives
- report-generation primitives that still fit the new product
- star/token economy concepts that tested well
- useful UI components after review
- clean copy/voice/card patterns
- test helpers worth keeping
- documentation that captures durable decisions

Rejected extraction candidates:

- old PNG files
- unused images
- dead routes
- abandoned experiments
- duplicated components
- Supabase-specific plumbing
- unclear migrations
- stale environment variables
- half-built feature branches
- temporary scaffolding
- anything that makes the new repo harder to fit into a context window

Rule:

> If a thing does not earn its place in the new repo, it stays behind.

---

## 8. Hora Watchmaker Principle

Astra should be organized like Hora’s watch, not Tempus’s watch.

The system must form stable intermediate structures.

Each module should be:

- independently understandable
- independently testable
- independently replaceable
- small enough for human review
- small enough for agent context windows
- connected through typed contracts
- free of hidden app-level coupling

The reason is not aesthetic cleanliness.
The reason is survival math.

Large entangled systems fail by interruption, side effect, and accumulated cognitive debt.
Small stable modules survive interruption because only the current subassembly falls apart.

Astra needs stable subassemblies.

---

## 9. Proposed New Repo Shape

Initial shape:

```txt
astra/
  apps/
    astra-web/
    composer-web/

  packages/
    astrology/
    contracts/
    db/
    ui/
    config/
    testkit/

  docs/
    inbox/
    architecture/
    decisions/

  scripts/
    seed/
    validate/
    export/
```

### apps/astra-web

Public user-facing Astra app.

Owns:

- stream display
- account/self area
- achievements UI
- allies UI
- artifacts/library UI
- gifts/stars UI
- user-facing auth/session experience

Does not own:

- Composer internals
- ranking machinery
- campaign machinery
- unpublished drafts
- sponsor logic
- admin queues

### apps/composer-web

Internal operator/admin app.

Owns:

- card creation
- card editing
- stream curation
- voice systems
- campaign staging
- review queues
- publishing workflows
- simulator tools

Composer may publish artifacts into Astra through explicit contracts.
Composer internals must remain invisible to Astra.

### packages/astrology

Pure astrology primitives.

Should contain calculation/domain logic that can be used without importing app code.

Rules:

- no React dependency unless placed in a separate UI package
- no database dependency unless deliberately isolated
- no app imports
- deterministic functions where possible
- strong tests

### packages/contracts

The treaty layer between modules.

Owns:

- Zod schemas
- TypeScript types
- stream item contracts
- card contracts
- gift/star transaction contracts
- artifact contracts
- ally contracts
- achievement contracts

This package should stay boring, strict, and heavily tested.

### packages/db

Database access and schema helpers.

Rules:

- no app-specific business leakage
- clear separation of read/write functions
- explicit environment targeting
- safe local/dev/prod handling
- no legacy Supabase assumptions

### packages/ui

Small shared UI atoms only.

Allowed:

- buttons
- cards
- typography
- icons
- layout primitives
- empty states
- loading states

Forbidden:

- app-specific business logic
- Composer-only workflows
- Astra-only page-level assumptions

### packages/config

Shared configuration.

Owns:

- eslint
- TypeScript config
- prettier/formatting
- environment validation helpers
- shared build conventions

### packages/testkit

Reusable testing helpers.

Owns:

- factory data
- mock stream cards
- mock users
- test fixtures
- E2E helper utilities if cleanly generalized

---

## 10. Dependency Direction

Allowed:

```txt
apps/astra-web      -> packages/*
apps/composer-web   -> packages/*
packages/*          -> other packages only when explicitly justified
```

Forbidden:

```txt
apps/astra-web      -> apps/composer-web
apps/composer-web   -> apps/astra-web
packages/*          -> apps/*
packages/astrology  -> apps/*
packages/contracts  -> apps/*
packages/ui         -> app business logic
```

The repo must prevent circular dependency creep.

---

## 11. Context Window Discipline

The repo must be designed for human and agent comprehension.

Codex and future agents should be able to reason about one module at a time without loading the entire project into context.

Therefore:

- keep files short where possible
- keep modules small
- keep package boundaries real
- keep README files current
- document public interfaces
- isolate business domains
- avoid giant god components
- avoid giant utility junk drawers
- avoid “shared” packages that become dumping grounds

A module that cannot be summarized clearly probably needs splitting.

---

## 12. Product Model v0

The clean-start product model should begin with a small set of first-class nouns.

```txt
User
StreamItem
Card
Achievement
Ally
Artifact
Gift
StarTransaction
```

### User

Represents the person using Astra.

Should eventually own:

- profile state
- preferences
- onboarding status
- account state
- star balance

### StreamItem

A displayed item in the user’s stream.

May reference:

- card
- artifact
- reflection prompt
- achievement
- gift
- ally interaction

### Card

A content unit.

Can be contemplative, practical, symbolic, educational, or promotional if clearly marked and ethically handled.

### Achievement

A record of meaningful action or progress.

Examples:

- completed onboarding
- saved first artifact
- added first ally
- completed first reflection
- purchased stars
- gifted stars
- completed a study sequence

### Ally

A person, guide, ancestor, archetype, mentor, friend-like companion, or symbolic support figure.

Important language note:

- animals have instincts
- human minds have intuition

This distinction matters for Avatar®-aligned conceptual clarity and should influence future copy where relevant.

### Artifact

A saved meaningful object.

Examples:

- report
- reflection
- generated chart reading
- study note
- saved stream card
- ally session summary
- symbolic object

### Gift

A value or reward item.

May connect to stars, purchases, unlocks, bonuses, symbolic rewards, or user-visible benefits.

### StarTransaction

Accounting record for stars.

Examples:

- earned
- purchased
- spent
- gifted
- adjusted
- refunded

Stars tested well and should be treated as a core symbolic/economic primitive.

---

## 13. Engineering Priorities

Order of operations:

1. Create clean repo shell.
2. Establish package boundaries.
3. Add contracts first.
4. Add database schema second.
5. Add seed data third.
6. Add lean Astra web app fourth.
7. Extract astrology primitives only after interfaces are clear.
8. Add Composer only after Astra can consume published stream artifacts.
9. Add E2E tests around core user journeys.
10. Add deployment only when local/dev behavior is clean.

Do not start by copying the old app.
Do not start by importing UI clutter.
Do not start by recreating old routes.
Do not start by solving every future feature.

Start with the nouns and contracts.

---

## 14. Minimum Viable Clean Start

The first working version should prove:

- user can open Astra
- user can see stream cards
- user can view Self/account area
- user can see achievements list
- user can see allies list
- user can see artifacts/library list
- user can see gifts/stars area
- seed data works
- database can reset cleanly
- no Supabase dependency exists
- app builds locally
- tests run
- repo remains small and legible

That is enough for the first stable subassembly.

---

## 15. Anti-Entropy Rules

Every new feature must answer:

1. Which module owns this?
2. Which contract defines it?
3. Which tests prove it?
4. Which app consumes it?
5. What does it not know about?
6. Can this be removed without collapsing unrelated systems?

If those answers are unclear, the feature is not ready.

---

## 16. The Standard

Astra Clean Start should feel like a small, sharp instrument.

Not a bloated platform.
Not a SaaS maze.
Not a historical museum of every idea we tried.

The goal is not to preserve the old system.
The goal is to preserve the learned wisdom while discarding accumulated drag.

Build the new Astra as stable intermediate forms.
Small enough to understand.
Strong enough to grow.
Clean enough that future work feels obvious.

---

## 17. Codex Directive

Codex: treat this document as the inaugural architecture charter for the new Astra project.

Your job is not to migrate the existing repo wholesale.
Your job is to help create a clean, modular, minimal Astra repo that can selectively extract proven code from the old project.

Default stance:

```txt
New repo.
Clean database.
No Supabase carryover.
No legacy migrations.
No old clutter.
Small modules.
Typed contracts.
Context-window friendly.
Extract only what earns its place.
```

When in doubt, choose the smaller stable subassembly.
