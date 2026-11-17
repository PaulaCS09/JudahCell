import "server-only";
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, ensureDb, schema } from "./db/client";
import type { Product } from "./db/schema";

const { products, categories, compatibilities, settings } = schema;

export type ProductFilters = {
  q?: string;
  category?: string; // id de categoría o "accesorios"
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minStorageGb?: number;
  minRamGb?: number;
  only5g?: boolean;
  inStock?: boolean;
  sort?: "relevancia" | "precio_asc" | "precio_desc";
  limit?: number;
};

export async function getCategories() {
  await ensureDb();
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function listProducts(f: ProductFilters = {}): Promise<Product[]> {
  await ensureDb();
  const conds = [eq(products.active, true)];
  if (f.category === "accesorios") {
    const acc = await db.select({ id: categories.id }).from(categories).where(eq(categories.kind, "accessory"));
    conds.push(inArray(products.categoryId, acc.map((a) => a.id)));
  } else if (f.category) conds.push(eq(products.categoryId, f.category));
  if (f.brands?.length) conds.push(inArray(products.brand, f.brands));
  if (f.minPrice != null) conds.push(gte(products.priceCop, f.minPrice));
  if (f.maxPrice != null) conds.push(lte(products.priceCop, f.maxPrice));
  if (f.minStorageGb) conds.push(gte(products.storageGb, f.minStorageGb));
  if (f.minRamGb) conds.push(gte(products.ramGb, f.minRamGb));
  if (f.only5g) conds.push(eq(products.has5g, true));
  if (f.inStock) conds.push(gte(products.stock, 1));
  if (f.q?.trim()) {
    const terms = f.q.trim().toLowerCase().split(/\s+/).slice(0, 6);
    for (const t of terms) {
      const like = `%${t.replace(/[%_]/g, "")}%`;
      conds.push(sql`lower(${products.brand} || ' ' || ${products.model} || ' ' || ${products.description} || ' ' || ${products.highlights}) LIKE ${like}`);
    }
  }
  const order =
    f.sort === "precio_asc" ? [asc(products.priceCop)] :
    f.sort === "precio_desc" ? [sql`${products.priceCop} DESC`] :
    [asc(products.categoryId), sql`${products.stock} = 0`, asc(products.priceCop)];

  return db.select().from(products).where(and(...conds)).orderBy(...order).limit(f.limit ?? 100);
}

export async function getProduct(id: string) {
  await ensureDb();
  const [p] = await db.select().from(products).where(and(eq(products.id, id), eq(products.active, true)));
  return p ?? null;
}

export async function getProductsByIds(ids: string[]) {
  await ensureDb();
  if (!ids.length) return [];
  return db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true)));
}

export async function getPhones() {
  await ensureDb();
  return listProducts({ category: "celulares" });
}

export async function getBrands(category?: string) {
  await ensureDb();
  const list = await listProducts({ category });
  return [...new Set(list.map((p) => p.brand))].sort();
}

/** Accesorios compatibles VERIFICADOS para un celular. */
export async function getCompatibleAccessories(phoneId: string) {
  await ensureDb();
  const rows = await db
    .select({ product: products, note: compatibilities.note })
    .from(compatibilities)
    .innerJoin(products, eq(products.id, compatibilities.accessoryId))
    .where(and(eq(compatibilities.phoneId, phoneId), eq(products.active, true)))
    .orderBy(asc(products.categoryId), asc(products.priceCop));
  return rows.map((r) => ({ ...r.product, compatNote: r.note }));
}

/** Celulares con los que un accesorio es compatible (verificado). */
export async function getAccessoryCompatibility(accessoryId: string) {
  await ensureDb();
  const rows = await db
    .select({ id: products.id, brand: products.brand, model: products.model })
    .from(compatibilities)
    .innerJoin(products, eq(products.id, compatibilities.phoneId))
    .where(eq(compatibilities.accessoryId, accessoryId));
  return rows;
}

export type StoreSettings = {
  store_name: string;
  city: string;
  store_address: string | null;
  store_hours: string | null;
  whatsapp: string | null;
  warranty: { months: number; coverage: string; requirements: string[]; resolution: string; notes: string[] };
  payment_methods: { id: string; name: string; detail: string }[];
  delivery: {
    pickup: { enabled: boolean; detail: string };
    home: { enabled: boolean; city: string; detail: string };
    rates: { locality: string; costCop: number }[] | null;
    estimated_times: string | null;
  };
};

export async function getSettings(): Promise<StoreSettings> {
  await ensureDb();
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as StoreSettings;
}
