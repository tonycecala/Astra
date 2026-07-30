import { redirect } from "next/navigation";
import { JourneyStepReader } from "../../components/JourneyStepReader";
import { PageHeader } from "../../components/PageHeader";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";
import { getJourneyViewModel } from "../../lib/journey";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const { profile } = await getAstraAuthContext();
  if (!profile) redirect("/login?next=/journey");
  const view = await getJourneyViewModel(profile.userId, { userRole: profile.role });
  return <><PageHeader eyebrow={ui.journey.eyebrow} title={ui.journey.title}>{ui.journey.intro}</PageHeader><JourneyStepReader {...view} /></>;
}
