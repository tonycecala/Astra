import { redirect } from "next/navigation";
import { JourneyStepReader } from "../../components/JourneyStepReader";
import { PageHeader } from "../../components/PageHeader";
import { getAstraAuthContext } from "../../lib/auth/profile";
import { ui } from "../../lib/i18n";
import { getJourneyViewModel } from "../../lib/journey";
import { ensureComposerOnboardingJourney } from "../../lib/journey-producers";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const { profile } = await getAstraAuthContext();
  if (!profile) redirect("/login?next=/journey");
  try {
    await ensureComposerOnboardingJourney({ onboardingStatus: profile.onboardingStatus, userId: profile.userId });
  } catch (error) {
    console.error("Journey onboarding cards are not ready; Astra will retry when Journey is opened again.", error);
  }
  const view = await getJourneyViewModel(profile.userId, { userRole: profile.role });
  return <><PageHeader eyebrow={ui.journey.eyebrow} title={ui.journey.title}>{ui.journey.intro}</PageHeader><JourneyStepReader {...view} /></>;
}
