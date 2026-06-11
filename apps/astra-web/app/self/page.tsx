import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";
import { ui } from "../../lib/i18n";

export default function SelfPage() {
  const view = getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow={ui.self.eyebrow} title={view.user.displayName}>
        {ui.self.intro}
      </PageHeader>
      <section className="grid" aria-label={ui.self.summaryLabel}>
        <article className="card">
          <div className="eyebrow">{ui.self.stars}</div>
          <div className="metric">{view.user.starBalance}</div>
          <p>{ui.self.starsDescription}</p>
        </article>
        <article className="card">
          <div className="eyebrow">{ui.self.onboarding}</div>
          <h2>{view.user.onboardingStatus}</h2>
          <p>{ui.self.onboardingDescription}</p>
        </article>
        <article className="card">
          <div className="eyebrow">{ui.self.achievement}</div>
          <h2>{view.achievements[0]?.title}</h2>
          <p>{view.achievements[0]?.description}</p>
        </article>
      </section>
    </>
  );
}
