import { getSeedForDatabase } from "@astra/db/src/seed";

const seed = getSeedForDatabase();
console.log(`Seed package ready: ${seed.cards.length} cards, ${seed.streamItems.length} stream items, ${seed.gifts.length} gifts.`);
console.log("Apply with the Drizzle client once a local Postgres database is running.");
