import { desc, eq, gt } from "drizzle-orm";
import { closeDatabaseConnection, createUserFeedItem, db, session, user } from "@astra/db";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

const targetEmail = clean(process.env.ASTRA_PRIVATE_FEED_EMAIL);
const now = new Date().toISOString();

async function resolveTargetUser() {
  if (targetEmail) {
    const [row] = await db
      .select({ userId: user.id, email: user.email })
      .from(user)
      .where(eq(user.email, targetEmail))
      .limit(1);
    if (!row) throw new Error(`No local user found for ASTRA_PRIVATE_FEED_EMAIL=${targetEmail}.`);
    return row;
  }

  const [row] = await db
    .select({ userId: user.id, email: user.email })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(gt(session.expiresAt, new Date()))
    .orderBy(desc(session.updatedAt))
    .limit(1);

  if (!row) {
    throw new Error("No active local session found. Sign in locally or set ASTRA_PRIVATE_FEED_EMAIL.");
  }

  return row;
}

try {
  const target = await resolveTargetUser();
  const feedItem = await createUserFeedItem(db, {
    id: `private_comparison_card:${target.userId}`,
    userId: target.userId,
    feedKind: "manual",
    title: "Private comparison card",
    body: "This card exists only in this signed-in user's private feed. Incognito should not see it.",
    displayPayload: {
      subtitle: `Private seed for ${target.email}`,
      lane: "today",
      tone: "bright",
      ctaLabel: "Compare",
      ctaAction: "open",
      source: "local_private_comparison_seed"
    },
    rankScore: 2_000,
    reasonCode: "local_private_comparison_seed",
    state: "available",
    availableAt: now
  });

  console.log(`Private comparison card ready for ${target.email}: ${feedItem.id}`);
} finally {
  await closeDatabaseConnection();
}
