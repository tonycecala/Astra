import { PageHeader } from "../../components/PageHeader";
import { StreamReader } from "../../components/StreamReader";
import { getFoundationViewModel } from "../../lib/foundation";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const view = await getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow={ui.journey.eyebrow} title={ui.journey.title}>
        {ui.journey.intro}
      </PageHeader>
      <div className="status-strip">
        <span className="pill">{ui.journey.seededStream}</span>
        <span className="pill">{ui.journey.noLegacyData}</span>
        <span className="pill">{ui.journey.cardCount(view.streamCards.length)}</span>
      </div>
      <StreamReader streamCards={view.streamCards} />
    </>
  );
}
