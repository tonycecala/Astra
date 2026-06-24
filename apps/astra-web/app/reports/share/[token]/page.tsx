import { ReportReader } from "../../../../components/ReportReader";
import { db, getSharedAstrologyReport } from "@astra/db";
import { ui } from "../../../../lib/i18n";

export const dynamic = "force-dynamic";

type SharedReportPageParams = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharedReportPage({ params }: SharedReportPageParams) {
  const { token } = await params;
  const sharedReport = await getSharedAstrologyReport(db, token);

  if (!sharedReport) {
    return (
      <section className="card" aria-label={ui.library.sharedReportLabel}>
        <div className="eyebrow">{ui.library.sharedReportEyebrow}</div>
        <h1>{ui.library.sharedReportUnavailableTitle}</h1>
        <p>{ui.library.sharedReportUnavailableBody}</p>
      </section>
    );
  }

  return <ReportReader report={sharedReport.result} request={sharedReport.request} shared />;
}
