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

type CatalogFile = {
  categories: { id: string; name: string; kind: "phone" | "accessory"; sortOrder?: number }[];
  products: Record<string, unknown>[];
  compatibilities: { accessoryId: string; phoneIds: string[] | "ALL_PHONES" | "ALL_USB_C"; note?: string }[];
  settings: Record<string, unknown>;
  demoOrders?: {
    code: string; customerName: string; phone: string; email: string | null;
    deliveryMode: string; address: string | null; locality: string | null;
    paymentMethod: string; status: string; deliveryCostCop: number | null;
    items: { productId: string; quantity: number }[]; createdAt: string;
  }[];
};

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

const col: Record<string, string> = {
  id: "id", categoryId: "category_id", brand: "brand", model: "model", description: "description",
  priceCop: "price_cop", stock: "stock", image: "image", imageIsIllustration: "image_is_illustration",
  ramGb: "ram_gb", storageGb: "storage_gb", mainCameraMp: "main_camera_mp", cameraSummary: "camera_summary",
  batteryMah: "battery_mah", screen: "screen", processor: "processor", performanceScore: "performance_score", cameraScore: "camera_score", batteryScore: "battery_score",
  has5g: "has_5g", connector: "connector", highlights: "highlights", colors: "colors",
  warrantyMonths: "warranty_months", isDemo: "is_demo", active: "active",
};

async function main() {
  const migration = readFileSync("db/migrations/001_init.sql", "utf8");
  await db.executeMultiple(migration);

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
  const stmts: { sql: string; args: (string | number | null)[] }[] = [];

  for (const c of catalog.categories) {
    stmts.push({ sql: "INSERT INTO categories (id,name,kind,sort_order) VALUES (?,?,?,?)", args: [c.id, c.name, c.kind, c.sortOrder ?? 0] });
  }

  const phoneCategoryIds = new Set(catalog.categories.filter((c) => c.kind === "phone").map((c) => c.id));
  const phones = catalog.products.filter((p) => phoneCategoryIds.has(p.categoryId as string));

  for (const p of catalog.products) {
    const row: Record<string, unknown> = { isDemo: isDemoCatalog, active: true, highlights: [], colors: [], ...p };
    const keys = Object.keys(row).filter((k) => col[k]);
    const values = keys.map((k) => {
      const v = row[k];
      if (Array.isArray(v)) return JSON.stringify(v);
      if (typeof v === "boolean") return v ? 1 : 0;
      return (v ?? null) as string | number | null;
    });
    stmts.push({
      sql: `INSERT INTO products (${keys.map((k) => col[k]).join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
      args: values,
    });
  }

  for (const c of catalog.compatibilities) {
    let ids: string[];
    if (c.phoneIds === "ALL_PHONES") ids = phones.map((p) => p.id as string);
    else if (c.phoneIds === "ALL_USB_C") ids = phones.filter((p) => p.connector === "USB-C").map((p) => p.id as string);
    else ids = c.phoneIds;
    for (const phoneId of ids) {
      stmts.push({ sql: "INSERT INTO compatibilities (accessory_id, phone_id, note) VALUES (?,?,?)", args: [c.accessoryId, phoneId, c.note ?? null] });
    }
  }

  for (const [key, value] of Object.entries(catalog.settings)) {
    stmts.push({ sql: "INSERT INTO settings (key, value) VALUES (?, ?)", args: [key, JSON.stringify(value)] });
  }

  const priceOf = new Map(catalog.products.map((p) => [p.id as string, p]));
  for (const o of catalog.demoOrders ?? []) {
    const subtotal = o.items.reduce((s, it) => s + (priceOf.get(it.productId)!.priceCop as number) * it.quantity, 0);
    stmts.push({
      sql: `INSERT INTO orders (code,customer_name,phone,email,delivery_mode,address,locality,payment_method,status,subtotal_cop,delivery_cost_cop,notes,is_demo,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
      args: [o.code, o.customerName, o.phone, o.email, o.deliveryMode, o.address, o.locality, o.paymentMethod, o.status, subtotal, o.deliveryCostCop, "PEDIDO DE PRUEBA", o.createdAt],
    });
    for (const it of o.items) {
      const p = priceOf.get(it.productId)!;
      stmts.push({
        sql: "INSERT INTO order_items (order_code, product_id, product_name, unit_price_cop, quantity) VALUES (?,?,?,?,?)",
        args: [o.code, it.productId, String(p.brand).startsWith("Genérico") ? String(p.model) : `${p.brand} ${p.model}`, p.priceCop as number, it.quantity],
      });
    }
  }

  await db.batch(stmts, "write");
  console.log(`• Catálogo cargado desde ${catalogPath}: ${catalog.products.length} productos, ${catalog.categories.length} categorías`);
  if (isDemoCatalog) console.log("  (marcados como DATOS DE DEMOSTRACIÓN)");
}

main().catch((e) => {
  console.error("Error configurando la base de datos:", e);
  process.exit(1);
});
