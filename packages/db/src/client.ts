import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolveDatabaseUrl } from "./env";
import * as schema from "./schema";

const queryClient = postgres(resolveDatabaseUrl(), {
  max: 5,
  prepare: false
});

export const db = drizzle(queryClient, { schema });
export type AstraDb = typeof db;
