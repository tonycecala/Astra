import { redirect } from "next/navigation";
import { AuthPanel } from "../components/AuthPanel";
import { PageHeader } from "../components/PageHeader";
import { PublicJourneyPreview } from "../components/PublicJourneyPreview";
import { getAstraAuthContext } from "../lib/auth/profile";
import { ui } from "../lib/i18n";
import { getPublicJourneyPreview } from "../lib/journey";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { profile } = await getAstraAuthContext();
  if (profile) redirect("/journey");
  const cards = await getPublicJourneyPreview();
  return <><PageHeader eyebrow={ui.journey.eyebrow} title={ui.journey.publicTitle}>{ui.journey.publicIntro}</PageHeader><section className="auth-gate-grid" aria-label={ui.login.pageKicker}><article className="card auth-gate-card"><div className="eyebrow">{ui.login.pageKicker}</div><h2>{ui.login.pageTitle}</h2><p>{ui.login.pageIntro}</p><AuthPanel /></article></section><PublicJourneyPreview cards={cards} /></>;
}
