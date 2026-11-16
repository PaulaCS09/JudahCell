import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { recommendPhones, type PhoneLike } from "../src/lib/recommend";
import { orderRequestSchema, chatRequestSchema } from "../src/lib/validation";

const catalog = JSON.parse(readFileSync("db/seed/catalog.demo.json", "utf8"));
const phones: PhoneLike[] = catalog.products
  .filter((p: { categoryId: string }) => p.categoryId === "celulares")
  .map((p: Record<string, unknown>) => ({ highlights: [], ramGb: null, storageGb: null, mainCameraMp: null, batteryMah: null, screen: null, has5g: null, ...p }));

test("respeta el presupuesto en la mejor opción y la alternativa económica", () => {
  const r = recommendPhones(phones, { budgetMaxCop: 800_000, uses: ["redes"] });
  const best = r.results.find((x) => x.role === "mejor_opcion")!;
  assert.ok(best.priceCop <= 800_000);
  const econ = r.results.find((x) => x.role === "alternativa_economica");
  if (econ) assert.ok(econ.priceCop < best.priceCop);
  assert.ok(r.results.length >= 2 && r.results.length <= 3);
});

test("marca explícitamente las opciones fuera de presupuesto", () => {
  const r = recommendPhones(phones, { budgetMaxCop: 900_000, uses: ["fotos"] });
  for (const x of r.results) {
    if (x.priceCop > 900_000) {
      assert.equal(x.overBudget, true);
      assert.ok(x.limitations.some((l) => l.includes("presupuesto")));
    }
  }
});

test("los requisitos indispensables excluyen productos que no los cumplen", () => {
  const r = recommendPhones(phones, { mustHave: ["5g"] });
  for (const x of r.results) assert.ok(phones.find((p) => p.id === x.id)!.has5g);
  assert.ok(r.excluded.some((e) => e.why.includes("5G")));
});

test("evita marcas indicadas por el cliente", () => {
  const r = recommendPhones(phones, { avoidedBrands: ["Xiaomi"] });
  assert.ok(r.results.every((x) => !x.name.startsWith("Xiaomi")));
});

test("prioridad de batería favorece las baterías grandes", () => {
  const r = recommendPhones(phones, { batteryImportance: 3, budgetMaxCop: 1_000_000 });
  const best = phones.find((p) => p.id === r.results[0].id)!;
  assert.ok((best.batteryScore ?? 0) >= 4);
});

test("sin candidatos devuelve una nota honesta", () => {
  const r = recommendPhones(phones, { budgetMaxCop: 100_000, mustHave: ["5g", "256gb"], avoidedBrands: ["Samsung", "Motorola", "Infinix", "Apple"] });
  assert.equal(r.results.length, 0);
  assert.ok(r.note);
});

test("validación de pedidos: celular colombiano y dirección para domicilio", () => {
  const base = { customerName: "Ana Pérez", phone: "+57 300 123 4567", deliveryMode: "pickup", paymentMethod: "efectivo", items: [{ productId: "x", quantity: 1 }], acceptsDataPolicy: true };
  const ok = orderRequestSchema.safeParse(base);
  assert.ok(ok.success);
  assert.equal(ok.success && ok.data.phone, "3001234567");
  assert.equal(orderRequestSchema.safeParse({ ...base, phone: "12345" }).success, false);
  assert.equal(orderRequestSchema.safeParse({ ...base, deliveryMode: "delivery" }).success, false);
  assert.equal(orderRequestSchema.safeParse({ ...base, acceptsDataPolicy: false }).success, false);
  assert.equal(orderRequestSchema.safeParse({ ...base, items: [{ productId: "x", quantity: 50 }] }).success, false);
});

test("validación del chat: limita longitud y rechaza perfiles inválidos", () => {
  assert.equal(chatRequestSchema.safeParse({ messages: [{ role: "user", text: "a".repeat(2001) }] }).success, false);
  assert.equal(chatRequestSchema.safeParse({ messages: [{ role: "user", text: "hola" }], profile: { hack: true } }).success, false);
  assert.ok(chatRequestSchema.safeParse({ messages: [{ role: "user", text: "hola" }] }).success);
});
