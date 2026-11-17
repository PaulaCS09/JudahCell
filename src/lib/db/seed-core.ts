import type { Client } from "@libsql/client";
import { MIGRATION_SQL } from "./migration";

export type CatalogFile = {
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

const col: Record<string, string> = {
  id: "id", categoryId: "category_id", brand: "brand", model: "model", description: "description",
  priceCop: "price_cop", stock: "stock", image: "image", imageIsIllustration: "image_is_illustration",
  ramGb: "ram_gb", storageGb: "storage_gb", mainCameraMp: "main_camera_mp", cameraSummary: "camera_summary",
  batteryMah: "battery_mah", screen: "screen", processor: "processor", performanceScore: "performance_score", cameraScore: "camera_score", batteryScore: "battery_score",
  has5g: "has_5g", connector: "connector", highlights: "highlights", colors: "colors",
  warrantyMonths: "warranty_months", isDemo: "is_demo", active: "active",
};


/** Crea las tablas si no existen. */
export async function migrate(db: Client) {
  await db.executeMultiple(MIGRATION_SQL);
}

/** Inserta el catálogo completo (categorías, productos, compatibilidades, configuración y pedidos de prueba). */
export async function seedCatalog(db: Client, catalog: CatalogFile, isDemoCatalog: boolean) {
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
}
