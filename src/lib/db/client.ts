import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import demoCatalog from "../../../db/seed/catalog.demo.json";
import * as schema from "./schema";
import { migrate, seedCatalog, type CatalogFile } from "./seed-core";

/**
 * Conexión a la base de datos.
 * - Local: DATABASE_URL=file:./data/judah.db (se crea con `npm run db:setup`).
 * - Producción con persistencia: Turso (libsql://...).
 * - Vercel sin DATABASE_URL: SQLite temporal en /tmp que se crea y llena sola con el
 *   catálogo de demostración. Sirve para la demo, pero los pedidos nuevos NO persisten
 *   entre reinicios del servidor (ver README → Despliegue).
 */
function resolveUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.VERCEL) return "file:/tmp/judah.db";
  return "file:./data/judah.db";
}

const globalForDb = globalThis as unknown as { __judahClient?: Client; __judahReady?: Promise<void> };

const client =
  globalForDb.__judahClient ??
  createClient({ url: resolveUrl(), authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
globalForDb.__judahClient = client;

export const db = drizzle(client, { schema });
export { schema };

/** Crea las tablas y carga el catálogo de demostración si la base está vacía. Se ejecuta una vez por instancia. */
export function ensureDb(): Promise<void> {
  globalForDb.__judahReady ??= (async () => {
    await migrate(client);
    const r = await client.execute("SELECT COUNT(*) AS n FROM products");
    if (Number(r.rows[0].n) === 0) {
      await seedCatalog(client, demoCatalog as unknown as CatalogFile, true);
      console.log("[db] Catálogo de demostración cargado automáticamente");
    }
  })().catch((e) => {
    globalForDb.__judahReady = undefined;
    throw e;
  });
  return globalForDb.__judahReady;
}
