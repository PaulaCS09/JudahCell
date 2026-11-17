/**
 * Crea las tablas y carga el catálogo.
 *
 *   npm run db:setup                       → crea tablas y carga el catálogo de demostración si la BD está vacía
 *   npm run db:reset                       → borra todo y vuelve a cargar el catálogo de demostración
 *   npm run db:reset -- --catalog ruta.json → borra todo y carga OTRO catálogo (ej. el real)
 *
 * El archivo de catálogo debe seguir el formato de db/seed/catalog.demo.json.
 */
import { createClient } from "@libsql/client";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { migrate, seedCatalog, type CatalogFile } from "../src/lib/db/seed-core";

// Carga .env.local / .env si existen (sin dependencias externas)
for (const f of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {}
}

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const catalogIdx = args.indexOf("--catalog");
const catalogPath = catalogIdx >= 0 ? args[catalogIdx + 1] : "db/seed/catalog.demo.json";
const isDemoCatalog = catalogIdx < 0;

const url = process.env.DATABASE_URL || "file:./data/judah.db";
if (url.startsWith("file:")) mkdirSync(path.dirname(url.slice(5)), { recursive: true });
const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });

async function main() {
  await migrate(db);

  if (reset) {
    await db.executeMultiple(`
      DELETE FROM order_items; DELETE FROM orders; DELETE FROM compatibilities;
      DELETE FROM products; DELETE FROM categories; DELETE FROM settings;`);
    console.log("• Base de datos vaciada");
  } else {
    const r = await db.execute("SELECT COUNT(*) AS n FROM products");
    if (Number(r.rows[0].n) > 0) {
      console.log("• La base de datos ya tiene productos. Usa `npm run db:reset` para recargar.");
      return;
    }
  }

  const catalog: CatalogFile = JSON.parse(readFileSync(catalogPath, "utf8"));
  await seedCatalog(db, catalog, isDemoCatalog);
  console.log(`• Catálogo cargado desde ${catalogPath}: ${catalog.products.length} productos, ${catalog.categories.length} categorías`);
  if (isDemoCatalog) console.log("  (marcados como DATOS DE DEMOSTRACIÓN)");
}

main().catch((e) => {
  console.error("Error configurando la base de datos:", e);
  process.exit(1);
});
