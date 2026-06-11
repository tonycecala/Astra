import { seedSnapshot } from "@astra/db/src/repositories";

const shouldExecute = process.argv.includes("--execute");
const seed = seedSnapshot();

if (!shouldExecute) {
  console.log(
    `Seed dry run: ${seed.cards.length} cards, ${seed.streamItems.length} stream items, ${seed.gifts.length} gifts.`
  );
  console.log("No database writes performed. Run npm run db:seed -- --execute after npm run db:migrate.");
  process.exit(0);
}

const { closeDatabaseConnection, db, seedFoundationData } = await import("@astra/db");
try {
  const result = await seedFoundationData(db, seed);
  console.log(
    `Seed applied: ${result.cards} cards, ${result.streamItems} stream items, ${result.gifts} gifts, ${result.starTransactions} star transactions.`
  );
} finally {
  await closeDatabaseConnection();
}
