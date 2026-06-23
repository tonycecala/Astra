import "server-only";

import { db, ensureBetaSignupCredits, getCreditBalance, upsertAuthUserProfile } from "@astra/db";
import { getAstraSession } from "./server";

export async function getAstraAuthContext() {
  const session = await getAstraSession();
  if (!session?.user) return { session: null, profile: null };

  const profile = await upsertAuthUserProfile(db, {
    userId: session.user.id,
    email: session.user.email,
    displayName: session.user.name || session.user.email
  });
  await ensureBetaSignupCredits(db, profile.userId);
  const starBalance = await getCreditBalance(db, profile.userId);

  return { session, profile: { ...profile, starBalance } };
}
