import { eq } from "drizzle-orm";
import { appUserProfiles, db, upsertAuthUserProfile, user } from "@astra/db";

const userId = `qa-auth-race-${crypto.randomUUID()}`;
const email = `${userId}@example.invalid`;

try {
  await db.insert(user).values({
    id: userId,
    name: "Auth Race QA",
    email,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const profiles = await Promise.all(
    Array.from({ length: 8 }, () =>
      upsertAuthUserProfile(db, {
        userId,
        email,
        displayName: "Auth Race QA"
      })
    )
  );

  if (profiles.some((profile) => profile.id !== `${userId}:profile`)) {
    throw new Error("Parallel profile initialization returned an unexpected profile.");
  }

  const rows = await db.select().from(appUserProfiles).where(eq(appUserProfiles.userId, userId));
  if (rows.length !== 1) {
    throw new Error(`Expected one profile after parallel initialization; found ${rows.length}.`);
  }

  console.log("Auth profile concurrency smoke passed.");
} finally {
  await db.delete(user).where(eq(user.id, userId));
}
