import "server-only";
import { randomInt } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "./db/client";
import { getSettings } from "./catalog";

const { orders, orderItems, products } = schema;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `JC-${s}`;
}

export type NewOrder = {
  customerName: string; phone: string; email?: string; deliveryMode: "pickup" | "delivery";
  address?: string; locality?: string; paymentMethod: "efectivo" | "transferencia" | "addi" | "sistecredito";
  notes?: string; items: { productId: string; quantity: number }[];
};

export class OrderError extends Error {}

/** Crea una solicitud de pedido. Los precios SIEMPRE se toman de la BD, nunca del cliente. */
export async function createOrder(input: NewOrder) {
  // Agrupar cantidades por producto
  const qty = new Map<string, number>();
  for (const it of input.items) qty.set(it.productId, (qty.get(it.productId) ?? 0) + it.quantity);

  const list = await db.select().from(products).where(and(inArray(products.id, [...qty.keys()]), eq(products.active, true)));
  if (list.length !== qty.size) throw new OrderError("Algunos productos ya no están disponibles. Revisa tu carrito.");
  for (const p of list) {
    if (p.stock < qty.get(p.id)!) throw new OrderError(`No hay suficientes unidades de ${p.brand} ${p.model} (disponibles: ${p.stock}).`);
  }

  const settings = await getSettings();
  let deliveryCost: number | null = null;
  if (input.deliveryMode === "delivery") {
    const rate = settings.delivery.rates?.find((r) => r.locality.toLowerCase() === (input.locality ?? "").toLowerCase());
    deliveryCost = rate ? rate.costCop : null; // null = por confirmar
  } else deliveryCost = 0;

  const subtotal = list.reduce((s, p) => s + p.priceCop * qty.get(p.id)!, 0);
  const code = newCode();
  const createdAt = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      code,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email || null,
      deliveryMode: input.deliveryMode,
      address: input.deliveryMode === "delivery" ? input.address ?? null : null,
      locality: input.deliveryMode === "delivery" ? input.locality ?? null : null,
      paymentMethod: input.paymentMethod,
      status: "recibido",
      subtotalCop: subtotal,
      deliveryCostCop: deliveryCost,
      notes: input.notes || null,
      isDemo: list.some((p) => p.isDemo),
      createdAt,
    });
    await tx.insert(orderItems).values(
      list.map((p) => ({ orderCode: code, productId: p.id, productName: `${p.brand.startsWith("Genérico") ? "" : p.brand + " "}${p.model}`, unitPriceCop: p.priceCop, quantity: qty.get(p.id)! })),
    );
    // Nota: en el MVP no se descuenta inventario hasta que un asesor confirme el pedido.
  });

  return { code, subtotal, deliveryCost, createdAt };
}

/** Consulta un pedido. Requiere código + celular (control de acceso básico). */
export async function findOrder(code: string, phone: string) {
  const [o] = await db.select().from(orders).where(and(eq(orders.code, code), eq(orders.phone, phone)));
  if (!o) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderCode, code));
  const imgs = await db.select({ id: products.id, image: products.image }).from(products).where(inArray(products.id, items.map((i) => i.productId)));
  const imgMap = new Map(imgs.map((i) => [i.id, i.image]));
  // Se devuelve solo lo necesario; el correo no se expone.
  return {
    code: o.code,
    customerFirstName: o.customerName.split(" ")[0],
    deliveryMode: o.deliveryMode,
    locality: o.locality,
    addressMasked: o.address ? o.address.replace(/\d/g, "•") : null,
    paymentMethod: o.paymentMethod,
    status: o.status,
    subtotalCop: o.subtotalCop,
    deliveryCostCop: o.deliveryCostCop,
    isDemo: o.isDemo,
    createdAt: o.createdAt,
    items: items.map((i) => ({ productId: i.productId, name: i.productName, unitPriceCop: i.unitPriceCop, quantity: i.quantity, image: imgMap.get(i.productId) ?? null })),
  };
}
