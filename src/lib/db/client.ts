import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __judahClient?: Client };

function makeClient() {
  return createClient({
    url: process.env.DATABASE_URL || "file:./data/judah.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
}

const client = globalForDb.__judahClient ?? makeClient();
if (process.env.NODE_ENV !== "production") globalForDb.__judahClient = client;

export const db = drizzle(client, { schema });
export { schema };
