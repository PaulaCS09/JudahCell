import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * Esquema de datos de JUDAH CELL.
 * Diseñado para reemplazar los datos de demostración por datos reales
 * sin cambiar el código: basta con cargar filas nuevas con isDemo = 0.
 */

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(), // ej. "celulares", "audifonos"
  name: text("name").notNull(),
  kind: text("kind", { enum: ["phone", "accessory"] }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(), // slug estable, ej. "galaxy-a37"
  categoryId: text("category_id").notNull().references(() => categories.id),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  description: text("description").notNull(),
  priceCop: integer("price_cop").notNull(), // precio en pesos colombianos, sin decimales
  stock: integer("stock").notNull().default(0),
  image: text("image").notNull(),
  imageIsIllustration: integer("image_is_illustration", { mode: "boolean" }).notNull().default(false),
  // Especificaciones (null cuando no aplica)
  ramGb: integer("ram_gb"),
  storageGb: integer("storage_gb"),
  mainCameraMp: integer("main_camera_mp"),
  cameraSummary: text("camera_summary"),
  batteryMah: integer("battery_mah"),
  screen: text("screen"),
  processor: text("processor"),
  // Calificaciones de referencia internas del catálogo, 1 (básico) a 5 (alto).
  // Las define el negocio; alimentan el motor de recomendaciones y el comparador.
  performanceScore: integer("performance_score"),
  cameraScore: integer("camera_score"),
  batteryScore: integer("battery_score"),
  has5g: integer("has_5g", { mode: "boolean" }),
  connector: text("connector"), // ej. "USB-C"
  highlights: text("highlights", { mode: "json" }).$type<string[]>().notNull().default([]),
  colors: text("colors", { mode: "json" }).$type<string[]>().notNull().default([]),
  // Garantía: null = no confirmada para este producto
  warrantyMonths: integer("warranty_months"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(true),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

/** Compatibilidad accesorio ↔ celular, solo cuando está verificada. */
export const compatibilities = sqliteTable(
  "compatibilities",
  {
    accessoryId: text("accessory_id").notNull().references(() => products.id),
    phoneId: text("phone_id").notNull().references(() => products.id),
    note: text("note"),
  },
  (t) => [primaryKey({ columns: [t.accessoryId, t.phoneId] })],
);

export const orders = sqliteTable("orders", {
  code: text("code").primaryKey(), // ej. JC-7K2M9Q
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  deliveryMode: text("delivery_mode", { enum: ["pickup", "delivery"] }).notNull(),
  address: text("address"),
  locality: text("locality"),
  paymentMethod: text("payment_method", { enum: ["efectivo", "transferencia", "addi", "sistecredito"] }).notNull(),
  status: text("status", {
    enum: ["recibido", "confirmado", "listo_para_recoger", "en_camino", "entregado", "cancelado"],
  })
    .notNull()
    .default("recibido"),
  subtotalCop: integer("subtotal_cop").notNull(),
  deliveryCostCop: integer("delivery_cost_cop"), // null = por confirmar
  notes: text("notes"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderCode: text("order_code").notNull().references(() => orders.code),
  productId: text("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  unitPriceCop: integer("unit_price_cop").notNull(),
  quantity: integer("quantity").notNull(),
});

/** Configuración del negocio (dirección, horarios, tarifas…). Valores JSON. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
});

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
