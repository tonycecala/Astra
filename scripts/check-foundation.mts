import { readFile } from "node:fs/promises";
import { foundationSeedSchema } from "@astra/contracts";
import { getFoundationSeed } from "@astra/testkit";

const seed = foundationSeedSchema.parse(getFoundationSeed());
if (seed.cards.length !== seed.streamItems.length) {
  throw new Error("Every seed stream item should have a matching visible card in this foundation.");
}

const schema = await readFile("packages/db/src/schema.ts", "utf8");
for (const table of ["user", "session", "account", "verification", "app_user_profiles", "stream_items", "cards", "achievements", "allies", "artifacts", "gifts", "star_transactions"]) {
  if (!schema.includes(`"${table}"`)) throw new Error(`Missing schema table: ${table}`);
}

const runtimeFiles = ["packages/db/src/client.ts", "apps/astra-web/app/api/auth/[...all]/route.ts", "apps/astra-web/lib/auth/server.ts"];
for (const file of runtimeFiles) {
  const text = await readFile(file, "utf8");
  if (/create table|alter table|create policy|create role|grant |revoke /i.test(text)) {
    throw new Error(`${file} contains runtime DDL or grants.`);
  }
}

console.log("Foundation contracts, seed data, schema, and runtime DDL checks passed.");
