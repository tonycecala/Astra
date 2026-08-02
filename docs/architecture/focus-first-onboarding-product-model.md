---
title: "Focus-first Onboarding Product Model"
status: "approved"
product: "Astra"
owner: "Tony"
created: "2026-08-01"
updated: "2026-08-02"
implementation_status: "implemented-and-verified"
schema_change: "none"
---

# Focus-first Onboarding Product Model

## Approval decision

Approve one new first-run product rule:

> Before Astra asks for birth details, it asks what the Explorer wants to understand. That declared focus shapes the private Chart Arrival and creates exactly one private first Journey step.

Tony approved this model for implementation. The verified implementation keeps this document as its product contract.

## Product outcome

A new Explorer should move through one coherent promise:

1. **Declare a starting interest.**
2. **Provide the chart data Astra needs.**
3. **Receive a grounded First Glimpse shaped by that interest.**
4. **Enter Journey with one useful next exploration instead of an empty state.**

Chart Arrival remains the onboarding success moment. Journey receives one continuation, not a second welcome, a setup checklist, or the retired five-card Composer sequence.

## Governing patterns

This slice applies:

- `01-time-to-value.md`: reach a personally meaningful first insight quickly.
- `03-discovery.md`: offer one relevant next exploration with a reason and action.
- `04-personalisation.md`: begin from declared intent, not hidden inference.
- `05-progressive-disclosure.md`: reveal the optional question only after a focus is chosen.
- `06-setup-defaults.md`: provide an honest broad path when focus is skipped.
- `07-empty-states.md`: prevent a new Explorer from landing on “Your Journey is clear.”
- `08-success-moments.md`: preserve Chart Arrival as the earned first-chart ritual.
- `12-commitment.md`: make the declared focus editable, forgiving, and non-coercive.
- `13-intent-mirroring.md`: explain how the Explorer's choice shaped what appears.
- `20-fail-safe.md`: retries cannot duplicate or resurrect Journey steps.
- `32-jtbd-copywriting.md`: use action and outcome language rather than system language.
- `36-trust-building.md`: keep the focus private, explain its use, and never overclaim.

The dark-pattern check passes only if focus remains optional, private, editable, and explainable. There is no urgency, streak, fear copy, hidden personalization, contact capture, or paywall before value.

## Scope

In scope:

- New signed-in customer onboarding on Self.
- One single-choice starting-focus question.
- One optional private question.
- Focus-shaped Chart Arrival copy.
- Exactly one private first Journey step.
- Editing or clearing the current focus from Self.
- Reuse of existing profile metadata, chart `question`/`intent`/`context`, Chart Arrival, and `UserFeedItem` paths.
- Product evals, analytics contract, privacy rules, and browser acceptance.

Out of scope:

- Any database migration or new table.
- Restoring the five legacy Composer onboarding cards.
- A general preference center.
- A new report type, free report, paid-report order, credit debit, or paywall.
- Retrofitting a first-step card into existing accounts.
- Transits, forecasts, diagnoses, or claims that a current event is astrologically caused.
- Public focus data, social features, notifications, streaks, or a broad Journey feed.

## Final focus taxonomy

The choice is single-select. No option is preselected. The order is stable.

| Key | Visible label | Supporting copy | Normalized `intent` snapshot |
|---|---|---|---|
| `self_understanding` | **Understand myself** | See the patterns that shape how you move through life. | `Understand myself.` |
| `relationships` | **Understand my relationships** | Explore how you connect, need, and respond. | `Understand my relationships.` |
| `work_purpose` | **Find direction in work and purpose** | Look at motivation, contribution, and the work that fits. | `Find direction in work and purpose.` |
| `change_transition` | **Make sense of a change** | Use your chart as a reflective baseline during a transition. | `Make sense of a change without predicting its cause or outcome.` |
| `learn_chart` | **Learn how my chart works** | Begin with the placements and patterns behind the reading. | `Learn how my chart works.` |

`Skip for now` is an action, not a sixth taxonomy value. An explicit skip records `status: "skipped"` so Astra does not repeatedly ask during the same onboarding. It uses the broad chart-orientation fallback.

The taxonomy is intentionally small. It captures why the Explorer came without pretending one answer defines their identity.

## Optional-question behavior

After a focus is selected, progressively reveal one optional field.

**Label**

> Is there a question behind that?

**Placeholder**

> What would you like to understand?

**Helper copy**

> Optional. Keep it to what you want to understand; you do not need to share names or private details.

**Privacy copy**

> Private to your Astra. Your question will not appear in public samples or analytics.

Rules:

- Maximum 280 characters after trimming.
- Empty or whitespace-only input is omitted.
- The question requires a selected focus; it is not shown on the skip path.
- Astra may use the question as private editorial context, but it is not evidence about the Explorer's life.
- Chart Arrival and Journey must not quote the question verbatim.
- The question must never enter analytics, public signals, public samples, customer-visible provenance, Composer decision traces, URLs, logs, or error messages.
- Editing focus preserves the question in the form for review; the Explorer may change or clear it before saving.
- Clearing focus also clears the current question after explicit confirmation.

## First-run flow and final UX copy

### Entry

After a successful first email-code sign-in, a customer with `onboardingStatus: "pending"` and no Self chart enters `/self#self-birth-onboarding` at Step 1.

The complete flow is:

1. Starting focus.
2. Your name.
3. Birth details.
4. Arrival.

Existing accounts, Ally flows, report-order flows, and admin/operator accounts do not receive the new first-run step.

### Step 1: Starting focus

**Progress**

> Step 1 of 4: Starting focus

**Heading**

> What brings you to Astra right now?

**Introduction**

> Choose one place to begin. Astra will use it to shape your first glimpse and what appears next. You can change it anytime.

**Group label**

> Choose your starting focus

**Primary action after selection**

> Begin with this focus

**Secondary action**

> Skip for now

**Saving state**

> Saving your focus…

**Save failure**

> Astra could not save your focus. Your choice is still here; try again.

The primary action is disabled until one focus is selected. `Skip for now` remains available. Neither action implies payment or report creation.

### Step 2: Your name

Keep the current name step and validation. Its position changes, but its product job does not.

### Step 3: Birth details

Keep the current birth-date/time/location behavior, unknown-time path, precision explanations, place search, validation, and resume gating.

### Step 4: Arrival

Keep:

- `Your Astra has arrived.`
- `Chart recognition` evidence.
- `First Glimpse`.
- `Enter Astra`.

Selected-focus orientation:

> This first glimpse begins with **{focus label}**. You can change your focus later in Self. Journey will hold one next exploration when you enter Astra.

Skipped-focus orientation:

> This first glimpse begins with the verified shape of your chart. You can choose a focus later in Self. Journey will hold one next exploration when you enter Astra.

`Enter Astra` remains the single primary action. Its successful destination changes from Self to `/journey` only after the Chart Arrival completion and first Journey-step write both succeed.

### Editable focus on Self

Self owns the mutable preference.

**Panel label**

> CURRENT FOCUS

**Selected state title**

> {focus label}

**Selected state body**

> Astra uses this as context for future guidance. It does not define you, and you can change it anytime.

**Empty state title**

> No current focus

**Empty state body**

> Choose what you would like Astra to help you explore next.

**Actions**

- `Change focus`
- `Choose a focus`
- `Clear focus`

Clearing requires a compact confirmation because it also clears the current optional question. It does not delete charts, Chart Arrival, reports, Library artifacts, or Journey history.

## How focus shapes Chart Arrival

The focus is an editorial lens, never chart evidence.

The evidence layer remains computed from verified birth data. Focus may change which supported signals are emphasized and how they are explained, but it cannot create placements, aspects, houses, transits, biography, motives, diagnoses, relationship facts, career prescriptions, or predictions.

### Focus jobs

| Focus | Chart Arrival editorial job |
|---|---|
| `self_understanding` | Show how the verified signals coexist without reducing the Explorer to one sign. |
| `relationships` | Use supported chart signals to introduce inner needs and outward relating; do not infer a partner, relationship status, or relationship event. |
| `work_purpose` | Introduce supported motivation and expression patterns; do not prescribe a career or claim a vocation. |
| `change_transition` | Present the natal chart as a stable reflective baseline; do not identify, explain, time, or predict the change. |
| `learn_chart` | Explain what the visible verified placements mean and what remains unknown at the current birth-data precision. |
| skipped | Use the current broad verified-chart glimpse. |

### Generated-copy contract

The Chart Arrival rewrite receives:

- The existing verified evidence packet.
- The deterministic fallback.
- Focus status, key, label, and normalized intent.
- The optional private question when present.

The output must:

- Be 45-90 words.
- Name only evidence present in the packet.
- Make the chosen focus perceptible without mechanically repeating the option label.
- Treat the optional question as context, not something Astra has proved or fully answered.
- Avoid forecasting, certainty, spiritual authority, fear, diagnosis, invented biography, and purchase language.
- Avoid repeating the private question.
- Degrade to a focus-specific deterministic fallback when Composer is unavailable, slow, invalid, or unsafe.

The persisted Chart Arrival stores the focus snapshot and prompt version used. It remains stable on reload. Later focus edits do not rewrite this historical success moment.

## Exactly one first Journey step

### Product role

The first Journey step is the continuation of the Explorer's chosen thread. It is not another welcome, a task checklist, a report advertisement, or a duplicate of Chart Arrival.

It must contain one useful private exploration based on the chart, followed by one bounded reflection prompt. It may invite the Explorer to view the owning chart, but it must deliver value before the click.

### Fixed presentation copy

**Eyebrow**

> Your starting focus

**Subtitle**

> A first exploration from your chart

**Titles**

| Focus | Journey title |
|---|---|
| `self_understanding` | **Begin with the pattern that feels most like you** |
| `relationships` | **Begin with how you meet connection** |
| `work_purpose` | **Begin with what gives your effort direction** |
| `change_transition` | **Begin with the pattern you carry through change** |
| `learn_chart` | **Begin with the shape of your chart** |
| skipped | **Begin with the shape of your chart** |

**Primary action**

> View my chart

The server constructs the internal chart URL. Composer cannot supply an arbitrary URL.

**Why this now? — selected focus**

> You chose “{focus label}” as the place you wanted to begin. Astra used that choice only as context for this private exploration.

**Why this now? — skipped focus**

> You skipped a starting focus, so Astra began with a broad orientation to your chart.

**Focus-management link**

> Change focus in Self

### Generated-body contract

The body must:

- Be 90-150 words.
- Open with a focus-relevant chart observation that is not a copy of the First Glimpse.
- Use at least two supported chart signals when available, or state the precision limit plainly.
- End with one non-prescriptive reflection prompt.
- Deliver insight before the `View my chart` action.
- Avoid quoting the private question, predicting outcomes, inferring biography, or promoting a report.
- Avoid internal terms such as model, engine, rank, feed item, decision trace, or confidence score.
- Use a deterministic focus-specific fallback when Composer output fails validation.

### Persistence and ordering

On successful `Enter Astra`, Astra creates exactly one private `UserFeedItem`:

- Deterministic ID: `focus_first:{userId}:{chartRequestId}`.
- `feedKind`: `manual`.
- `reasonCode`: `focus_first_exploration`.
- Initial state: `available`.
- Owner: the authenticated customer.
- CTA destination: the owning private chart.
- Provenance: selected or skipped focus snapshot, never the raw optional question.

The write is idempotent. A retry may repair authored content before first materialization, but it cannot create a second item or resurrect an item that is completed, saved, dismissed, or expired.

The first step uses the existing Journey actions: Complete, Save for later, and Dismiss. It is not protected from user choice merely because it was created during onboarding.

The legacy `composer_onboarding_card` producer remains retired. No other onboarding item is created.

## No-schema data model

### Mutable current focus

Use the existing private `app_user_profiles.metadata` JSON object as the canonical mutable preference:

```json
{
  "explorerFocus": {
    "schemaVersion": 1,
    "status": "selected",
    "key": "relationships",
    "question": "How can I understand what I need in close relationships?",
    "selectedAt": "2026-08-01T12:00:00.000Z",
    "updatedAt": "2026-08-01T12:00:00.000Z"
  }
}
```

Skipped form:

```json
{
  "explorerFocus": {
    "schemaVersion": 1,
    "status": "skipped",
    "selectedAt": "2026-08-01T12:00:00.000Z",
    "updatedAt": "2026-08-01T12:00:00.000Z"
  }
}
```

Writes merge only the `explorerFocus` key and preserve unrelated profile metadata. Every read and write is scoped by authenticated `userId`.

### Immutable request snapshots

When the first Self chart request is created:

- Copy the normalized label to existing `ChartMakerRequest.intent`.
- Copy the optional text to existing `ChartMakerRequest.question`.
- Copy `{ schemaVersion, status, key }` to existing `ChartMakerRequest.context.explorerFocus`.

This slice does not change report ordering. If a later report UI explicitly offers focus inputs, it may prefill the current focus into the existing `intent` and `question` fields, but the Explorer must see and confirm or edit them. Astra must not silently apply a stale focus to a paid report.

Each report request owns its snapshot. Later focus edits do not rewrite chart results, Chart Arrival, report requests, generated reports, public signals, Library artifacts, or the first Journey step.

### Edit semantics

- Editing focus updates only profile metadata and future Composer context.
- Clearing focus records `status: "skipped"` and removes the current question after confirmation.
- Editing or clearing never creates another first Journey step.
- An already materialized first step remains the historical continuation of onboarding.
- Existing accounts may choose or edit a focus in Self, but they do not receive a retroactive onboarding step.

This proves the existing schema is sufficient. A new column or table is not justified for this slice.

## Transaction and failure behavior

### Save focus

- Save succeeds: persist private profile metadata and advance.
- Save fails: remain on Step 1, preserve local selection and question, show the retry message.
- Skip succeeds: persist explicit skipped status and advance.
- Reload after success: resume at the earliest incomplete later step; do not ask again.

### Reveal chart

- Chart request snapshots focus, intent, and question.
- Chart Arrival generation validates Composer output and falls back deterministically.
- Reload returns the same persisted Arrival.
- Missing/unknown birth time continues to omit Rising and house claims.

### Enter Astra

Chart Arrival completion and first Journey-step creation are one atomic product action:

1. Verify the Arrival and chart belong to the authenticated user.
2. Mark Chart Arrival complete.
3. Upsert the one deterministic first Journey item without changing prior user state.
4. Mark onboarding complete.
5. Redirect to `/journey`.

If any persistence step fails, the transaction rolls back, Arrival stays actionable, no partial or duplicate Journey item exists, and the UI shows:

> Astra could not open your Journey yet. Your chart and first glimpse are safe; try Enter Astra again.

## State matrix

| State | Required behavior |
|---|---|
| Logged out | Focus, question, chart, and Journey remain unavailable; use the normal sign-in path. |
| New customer, no focus decision | Show Starting focus as Step 1. |
| Selected focus | Enable `Begin with this focus`; reveal optional question. |
| Explicit skip | Persist skipped status and continue without a question. |
| Focus save loading | Disable duplicate submissions; preserve selection. |
| Focus save error | Stay on Step 1 with retryable error and no data loss. |
| Resume before chart | Start at earliest incomplete step; retain focus decision. |
| Date-only chart | Omit Rising/houses and state the precision limit. |
| Composer unavailable | Render deterministic focus-aware Arrival and Journey content. |
| Arrival visible | Keep persisted content stable across reload. |
| Enter Astra success | Open `/journey` with exactly one first step. |
| Enter Astra persistence error | Roll back and keep `Enter Astra` retryable. |
| First Journey step active | Show value, one chart CTA, Why this now?, and durable Journey actions. |
| Focus edited later | Update future context only; do not rewrite history or create a new starter. |
| Existing customer | Do not force onboarding or backfill a starter step. |
| Admin/operator | Preserve operational behavior; do not auto-create the Explorer starter. |

## Evaluation contract

### Deterministic and contract tests

Cover every focus key plus skipped status across both full and date-only chart precision.

Required assertions:

- Focus keys map to stable labels and normalized intents.
- Optional question is trimmed, capped at 280 characters, omitted when blank, and never accepted without a selected focus.
- Profile metadata merges without overwriting unrelated keys.
- Chart request receives the correct `question`, `intent`, and `context.explorerFocus` snapshot.
- Date-only inputs never produce Rising or house language.
- Composer failure, timeout, invalid JSON, or unsafe output uses deterministic fallback.
- Arrival reload is stable.
- `Enter Astra` creates one and only one `focus_first_exploration` item.
- Repeated completion calls do not duplicate or resurrect the item.
- User A cannot read or mutate User B's focus, Arrival, chart, or Journey step.
- The legacy five-card producer remains retired.
- No report request, report result, credit debit, or Library artifact is created by this slice.
- Editing focus does not mutate prior requests, Arrival, reports, or Journey history.

### Copy-quality eval set

Use at least these twelve fixtures:

- Five selected focuses plus skipped status with a full chart.
- The same six states with a date-only chart.

Add adversarial optional-question cases for:

- A question containing another person's name.
- A request for prediction or certainty.
- Health, legal, financial, or safety-sensitive language.
- A question that asserts an unsupported biography.
- Maximum length and whitespace-only input.

### Fatal eval categories

Any one of these blocks release:

- Wrong or invented chart evidence.
- Rising, houses, timing, or transit claims unsupported by input precision.
- Fabricated biography, relationship facts, motives, diagnosis, or predicted outcomes.
- Repetition or leakage of the raw optional question outside its private request context.
- Spiritual-authority, fear, coercion, or purchase pressure.
- Internal model, engine, prompt, ranking, or decision-trace leakage.
- Cross-user or public exposure.
- Missing deterministic fallback.
- Duplicate, resurrected, or more-than-one first Journey step.

Editorial preferences such as rhythm, word count within ±10%, or a reviewer preferring different phrasing are review notes, not fatal failures when meaning, evidence, privacy, and product purpose remain intact.

### Human approval sample

Before implementation is accepted, present Tony with one complete rendered example for each focus plus the skipped path, showing:

1. Selected option and optional question state.
2. First Glimpse.
3. First Journey step.
4. Why this now? provenance.

The product verdict remains human judgment; automated evals are evidence, not authority.

## Analytics contract

Runtime emission remains **N/A** until Astra has an approved client analytics transport. Do not create a console, localStorage, hidden fetch, or database telemetry substitute.

When transport exists, use the shared fields `surface`, `pattern`, `user_state`, `device`, `source`, and `result`, plus only the safe enums below.

| Event | Trigger | Additional safe properties |
|---|---|---|
| `focus_prompt_viewed` | Starting-focus step becomes visible. | `focus_status: "unset"` |
| `commitment_created` | A selected focus saves successfully for the first time. | `focus_key`, `has_question` boolean |
| `focus_skipped` | `Skip for now` saves successfully. | `focus_status: "skipped"` |
| `commitment_updated` | Focus or question is edited or cleared successfully in Self. | `focus_key` or `none`, `has_question` boolean |
| `first_value_reached` | Persisted Chart Arrival renders successfully for the first time. | `focus_key` or `none`, `chart_precision` |
| `success_moment_viewed` | Chart Arrival success surface is shown. | `milestone: "chart_arrival"` |
| `chart_arrival_completed` | `Enter Astra` transaction succeeds. | `focus_key` or `none`, `starter_created: true` |
| `journey_step_opened` | Explorer follows `View my chart`. | `reason_code: "focus_first_exploration"` |
| `journey_step_completed` | Explorer completes the first step. | `reason_code: "focus_first_exploration"` |
| `journey_step_saved` | Explorer saves the first step. | `reason_code: "focus_first_exploration"` |
| `journey_step_dismissed` | Explorer dismisses the first step. | `reason_code: "focus_first_exploration"` |

Never send the optional question, birth data, name, email, placements, generated prose, chart ID, report ID, or free-text error content to analytics.

Primary success measures after instrumentation exists:

- Focus-selection rate versus explicit skip rate.
- Birth-data completion by focus/skip cohort.
- Time from successful focus save to first value.
- `Enter Astra` completion rate.
- First Journey-step open, complete, save, and dismiss rates.
- Focus edit/clear rate as a trust and fit signal, not a failure by itself.

## Accessibility and responsive contract

- Render focus options as one labeled radio group with one tab stop per option and visible selected/focus states.
- Do not use color alone to communicate selection.
- Associate the optional question, helper, character limit, and inline error programmatically.
- Announce save errors and loading/success changes without moving keyboard focus unexpectedly.
- Return focus to the triggering control when the edit sheet or clear confirmation closes.
- Keep `Begin with this focus` as the single primary action; `Skip for now` is subordinate but plainly visible.
- On phone, keep the primary action in the existing compact bar above Astra's bottom navigation after the options extend beyond the viewport.
- Preserve readable option labels before helper copy; do not shrink typography to fit.
- Respect reduced-motion preferences; no confetti or blocking ceremony is added.

## Browser acceptance contract

Implementation is not accepted until the rendered journey passes at 390x844, 820x1180, and 1440x900.

### New-customer journey

1. Complete email-code sign-in through the callback/session path.
2. Verify redirect to Starting focus, not an empty Journey or report order.
3. Select each focus in focused coverage; verify only one can be selected.
4. Verify the optional question is progressive, private-copy is visible, and 280-character validation works.
5. Verify `Begin with this focus`, Back, resume, and `Skip for now` paths.
6. Complete known-time and unknown-time birth details.
7. Verify focused Chart Arrival uses only supported evidence and survives reload unchanged.
8. Click `Enter Astra`; verify `/journey` shows exactly one `focus_first_exploration` step.
9. Open `Why this now?`; verify the selected label or honest skipped explanation, no raw question, and `Change focus in Self`.
10. Follow `View my chart`; verify the exact private chart and correct navigation ownership.
11. Exercise Complete, Save, Dismiss, Restore, and retry behavior without duplication or resurrection.

### Error and fallback journey

- Focus-save 500 preserves local input and prevents advancement.
- Chart Arrival rewrite timeout and invalid response render the deterministic focused fallback.
- First-step generation failure also uses deterministic fallback.
- Atomic `Enter Astra` failure leaves Arrival visible and Journey item absent; retry creates exactly one item.
- Database read failure uses the existing Journey error boundary and does not expose private data.

### Adjacent regression sweep

- Logged-out `/`, `/login`, `/self`, and `/journey` preserve public/private boundaries.
- Existing customer Self, chart edit, report order, Journey report signals, Library, Allies, Gifts, and Stars remain unchanged.
- Admin/operator accounts receive no automatic focus-first Journey item.
- Deep links cannot bypass the earliest incomplete new-customer step unless focus was explicitly selected or skipped.
- No `composer_onboarding_card` becomes available or saved.
- No report or credit endpoint fires during focus-first onboarding.
- No horizontal overflow, trapped dialog, covered CTA, hydration failure, endless redirect, unexpected 404/500, or actionable console/page error occurs.

## Implementation acceptance checklist

Approval to implement does not waive these gates:

- [ ] Tony approves the question, five-option taxonomy, skip behavior, and exact copy.
- [ ] Tony approves the rule that focus edits are prospective and do not rewrite historical outputs.
- [ ] No database migration or new table is added.
- [ ] All visible UI chrome is added through Astra i18n.
- [ ] Existing `question`, `intent`, `context`, profile metadata, Chart Arrival, and `UserFeedItem` paths are reused.
- [ ] Chart Arrival remains the success moment.
- [ ] Exactly one first Journey step is created after successful Arrival completion.
- [ ] The five-card legacy onboarding sequence remains retired.
- [ ] Focus is private, editable, clearable, and skippable.
- [ ] Deterministic fallbacks pass every focus and precision fixture.
- [ ] Fatal eval categories are zero across the acceptance corpus.
- [ ] Analytics remain contract-only until a real transport is approved.
- [ ] Auth, privacy, idempotency, report/credit non-creation, and desktop/tablet/mobile browser acceptance pass.

## Owner approval requested

Approve this model as one decision, or identify the exact copy/taxonomy rule to revise. After approval, implementation should begin on a fresh `codex/` branch from current `alpha`, with the existing unrelated dirty work preserved.
