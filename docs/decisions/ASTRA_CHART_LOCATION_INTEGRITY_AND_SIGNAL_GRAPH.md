# Astra Chart Location Integrity and First Signal Graph

Status: accepted and implemented for chart-location integrity; signal graph is the next implementation design.

## Product Contract

Astra has two honest calculation modes:

- `full`: known birth time, timezone, and a resolved non-placeholder latitude/longitude. Houses, Rising, and angles may be used.
- `signs-aspects-only`: place or exact time is unresolved. Planetary signs and interplanetary aspects may be used; houses, Rising, Midheaven, and angle claims are omitted.

The UI does not add another step. It explains the consequence where chart settings are chosen. House-system controls appear only when houses can actually be calculated.

Every new report stores a version 2 basis snapshot with its server-derived calculation mode. Version 1 and pre-basis reports remain readable as `legacy / unknown`; their saved requests and prose are not rewritten when source chart data is repaired.

## Imported Data Repair

The July 2026 cleanup replaced placeholder coordinates on 15 imported charts with the coordinates of their recorded cities. Three intentionally placeless test charts remain placeless. The repair routine rebuilds current chart results while asserting that historical report requests and results do not change.

New chart writes reject partial coordinate pairs and the exact `0,0` placeholder. Editing a selected place label clears its old coordinates, so a new label cannot inherit another city's location.

## UI Pattern Acceptance

- Patterns: `05-progressive-disclosure`, `06-setup-defaults`, and `36-trust-building`.
- Outcome: a resolved place quietly unlocks full chart settings; no place remains usable with honest reduced scope.
- States: signed-out remains auth-gated; empty or failed place search permits signs-and-aspects-only; a selected resolved place permits full calculation; Library states the saved calculation detail.
- Analytics: N/A. This changes calculation integrity and provenance, not a new user behavior.
- Guardrails: no forced location, hidden consequence, fake precision, or extra wizard step.
- Public/private boundary: birth data, coordinates, chart snapshots, and reports remain private user-owned data.

## First Weighted Chart-Signal Graph

The first graph should improve synthesis without pretending every astrological fact is equally important.

### Eligible Inputs

Always eligible:

- Planet placements by sign and exact longitude.
- Major interplanetary aspects with measured orb.
- Report basis and immutable Zodiac setting.

Eligible only for `full` charts:

- Houses.
- Ascendant, Midheaven, and angle contacts.
- House rulership relationships.

Unknown or legacy provenance must not enter the graph as full-chart evidence.

### Graph Shape

- Placement nodes: Sun, Moon, planets, and eligible angles.
- Context nodes: signs, houses when eligible, elements, and modalities.
- Aspect edges: conjunction, opposition, square, trine, and sextile, carrying exact orb.
- Rulership edges: sign ruler and, only for full charts, house ruler.
- Theme nodes: identity, emotional life, relating, communication, work, resources, growth, and integration.

### Initial Weighting

Use transparent ordinal weights, not a mysterious single score:

1. Luminaries and Ascendant when eligible.
2. Tight aspects involving the Sun, Moon, chart ruler, or personal planets.
3. Angular placements and angle contacts when eligible.
4. Repeated themes supported by at least two independent signals.
5. Personal-planet sign and house placements.
6. Outer-planet signals only when tightly connected to personal planets or angles.

Aspect strength should decay with orb inside the configured allowable orb. A theme earns synthesis priority from repeated independent support, not from duplicating the same fact through several derived labels.

### Output Boundary

The graph produces ranked evidence clusters and tensions for the existing signal-card-to-prose pipeline. It does not write report prose, declare certainty, or introduce transits, progressions, or timing that the selected report basis did not request. Every surfaced theme must retain links to the chart facts that support it.

### First Evaluation

Use the same trusted Self and Ally charts across Tropical/Sidereal and Whole Sign/Placidus. Confirm that:

- changed calculations change graph evidence where they should;
- location-independent charts never surface house or angle evidence;
- high-ranked themes have at least two independent supports;
- Deep sections become more specific without becoming denser or more repetitive;
- an astrologer can inspect why each theme was ranked.
