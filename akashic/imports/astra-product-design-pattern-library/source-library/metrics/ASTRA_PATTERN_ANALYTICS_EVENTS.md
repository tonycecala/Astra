# Astra Pattern Analytics Events

## Naming Rules

Use snake_case event names.

Include:

- `surface`
- `pattern`
- `user_state`
- `device`
- `source`
- `result`

## Core Events

| Event | Trigger |
|---|---|
| `sandbox_started` | Anonymous user opens demo experience. |
| `sandbox_to_signup_clicked` | User chooses to make demo personal. |
| `first_value_reached` | User opens first personally relevant insight. |
| `stream_card_opened` | User opens a card. |
| `stream_card_saved` | User saves to Library. |
| `empty_state_cta_clicked` | User acts from an empty state. |
| `success_moment_viewed` | Meaningful milestone ceremony shown. |
| `chart_arrival_completed` | User explicitly chooses **Enter Astra** after viewing the persisted First Glimpse. Runtime emission is N/A until Astra has an analytics transport. |
| `journey_step_opened` | User follows a Journey step to its owning Astra surface. Runtime emission is N/A until Astra has an analytics transport. |
| `journey_step_completed` | User marks the current private Journey step complete. Runtime emission is N/A until Astra has an analytics transport. |
| `journey_step_saved` | User defers a Journey step into Saved for later. Runtime emission is N/A until Astra has an analytics transport. |
| `journey_step_dismissed` | User dismisses a Journey step from the active queue. Runtime emission is N/A until Astra has an analytics transport. |
| `journey_step_restored` | User restores a saved, completed, or dismissed Journey step. Runtime emission is N/A until Astra has an analytics transport. |
| `value_replay_opened` | Digest/notification/widget replay opened. |
| `library_artifact_created` | Report/card/reflection/certificate stored. |
| `commitment_created` | User declares goal/pace/focus. |
| `commitment_updated` | User edits commitment. |
| `deep_link_resolved` | User lands in promised context. |
| `paywall_viewed` | Paywall appears. |
| `paywall_converted` | User purchases/unlocks. |
| `permission_preface_viewed` | In-app explanation shown before native prompt. |
| `permission_granted` | Native permission accepted. |
| `permission_denied` | Native permission declined. |
| `destructive_action_undone` | User uses undo or restore. |

## Derived Metrics

| Metric | Formula |
|---|---|
| Activation Rate | users reaching `first_value_reached` / signups |
| Sandbox Conversion | `sandbox_to_signup_clicked` / `sandbox_started` |
| Time to Value | timestamp(`first_value_reached`) - first session timestamp |
| Library Attachment | retained users by artifact count cohort |
| Deep Link Completion | completed target action / `deep_link_resolved` |
| Permission Trust | granted / preface viewed |
| Paywall Conversion | `paywall_converted` / `paywall_viewed` |
| Empty State Lift | CTA clicked / empty state viewed |
