import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";

export default function SelfPage() {
  const view = getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow="Self" title={view.user.displayName}>
        The account home is small on purpose: identity, onboarding state, achievements, and star balance.
      </PageHeader>
      <section className="grid" aria-label="Self summary">
        <article className="card">
          <div className="eyebrow">Stars</div>
          <div className="metric">{view.user.starBalance}</div>
          <p>Seed balance for value-flow testing.</p>
        </article>
        <article className="card">
          <div className="eyebrow">Onboarding</div>
          <h2>{view.user.onboardingStatus}</h2>
          <p>Clean account state without legacy migration requirements.</p>
        </article>
        <article className="card">
          <div className="eyebrow">Achievement</div>
          <h2>{view.achievements[0]?.title}</h2>
          <p>{view.achievements[0]?.description}</p>
        </article>
      </section>
    </>
  );
}
