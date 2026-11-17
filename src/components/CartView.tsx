"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/db/schema";
import { formatCOP } from "@/lib/format";
import { DemoBadge } from "./Brand";
import { IconTrash } from "./Icons";
import { useStore } from "./providers/StoreProvider";

export function CartView() {
  const { cart, setQty, removeFromCart, syncCartPrices, openAdvisor } = useStore();
  const [stock, setStock] = useState<Record<string, number>>({});
  const [syncError, setSyncError] = useState(false);
  const ids = cart.map((c) => c.id).join(",");

  // Actualiza precios y existencias con la base de datos
  useEffect(() => {
    if (!ids) return;
    fetch(`/api/products?ids=${encodeURIComponent(ids)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { products: Product[] }) => {
        syncCartPrices(d.products);
        setStock(Object.fromEntries(d.products.map((p) => [p.id, p.stock])));
      })
      .catch(() => setSyncError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const phones = cart.filter((l) => l.categoryId === "celulares");
  const accessories = cart.filter((l) => l.categoryId !== "celulares");
  const subtotal = cart.reduce((s, l) => s + l.priceCop * l.quantity, 0);

  if (!cart.length)
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-3xl font-medium">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted">Explora el catálogo o deja que el asesor te ayude a encontrar lo que necesitas.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/catalogo" className="btn-outline">Ver catálogo</Link>
          <button onClick={() => openAdvisor()} className="btn-primary">Hablar con el asesor</button>
        </div>
      </div>
    );

  const Line = ({ l }: { l: (typeof cart)[number] }) => {
    const max = Math.min(5, stock[l.id] ?? 5);
    return (
      <li className="flex gap-4 py-4">
        <Image src={l.image} alt="" width={88} height={88} className="h-20 w-20 shrink-0 rounded-xl border border-line bg-white object-contain p-1" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Link href={`/producto/${l.id}`} className="font-medium hover:text-electric-600">{l.name}</Link>
            <p className="text-sm text-muted">{formatCOP(l.priceCop)} c/u {l.isDemo && <DemoBadge />}</p>
            {stock[l.id] === 0 && <p className="text-xs font-medium text-rose-600">Agotado: retíralo para continuar</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-line bg-white">
              <button onClick={() => setQty(l.id, l.quantity - 1)} disabled={l.quantity <= 1} className="px-3 py-1.5 disabled:opacity-30" aria-label={`Disminuir cantidad de ${l.name}`}>−</button>
              <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
              <button onClick={() => setQty(l.id, l.quantity + 1)} disabled={l.quantity >= max} className="px-3 py-1.5 disabled:opacity-30" aria-label={`Aumentar cantidad de ${l.name}`}>+</button>
            </div>
            <p className="w-28 text-right font-semibold">{formatCOP(l.priceCop * l.quantity)}</p>
            <button onClick={() => removeFromCart(l.id)} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={`Eliminar ${l.name}`}><IconTrash size={18} /></button>
          </div>
        </div>
      </li>
    );
  };

  const hasOutOfStock = cart.some((l) => stock[l.id] === 0);

  return (
    <div className="container-x py-8 sm:py-12">
      <h1 className="text-3xl font-medium sm:text-4xl">Tu carrito</h1>
      {syncError && <p className="mt-2 text-sm text-amber-700">No pudimos actualizar precios; se verificarán al confirmar el pedido.</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {phones.length > 0 && (
            <section className="card px-5">
              <h2 className="border-b border-line py-3 text-sm font-semibold text-muted">Celulares</h2>
              <ul className="divide-y divide-line">{phones.map((l) => <Line key={l.id} l={l} />)}</ul>
            </section>
          )}
          <section className="card px-5">
            <h2 className="border-b border-line py-3 text-sm font-semibold text-muted">Accesorios seleccionados</h2>
            {accessories.length ? (
              <ul className="divide-y divide-line">{accessories.map((l) => <Line key={l.id} l={l} />)}</ul>
            ) : (
              <p className="py-4 text-sm text-muted">
                No tienes accesorios.{" "}
                {phones[0] && <button onClick={() => openAdvisor(`Voy a comprar el ${phones[0].name}. ¿Qué accesorios compatibles me sugieres?`)} className="font-semibold text-electric-600 hover:underline">Ver accesorios compatibles con el asesor</button>}
              </p>
            )}
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg">Resumen</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal ({cart.reduce((s, l) => s + l.quantity, 0)} productos)</dt><dd className="font-medium">{formatCOP(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd className="text-right text-muted">Se define en el siguiente paso</dd></div>
          </dl>
          <div className="flex justify-between border-t border-line pt-4 text-lg font-bold"><span>Total</span><span>{formatCOP(subtotal)}</span></div>
          <p className="text-xs text-muted">El domicilio (si lo eliges) tiene un costo adicional según tu ubicación, que confirma un asesor.</p>
          <Link href="/checkout" aria-disabled={hasOutOfStock} className={`btn-primary w-full py-3.5 ${hasOutOfStock ? "pointer-events-none opacity-40" : ""}`}>Continuar con la compra</Link>
          <Link href="/catalogo" className="block text-center text-sm font-semibold text-electric-600 hover:underline">Seguir comprando</Link>
        </aside>
      </div>
    </div>
  );
}
