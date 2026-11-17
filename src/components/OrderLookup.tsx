"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PAYMENT_LABEL, STATUS_STEPS } from "@/lib/bogota";
import { formatCOP } from "@/lib/format";
import { DemoBadge } from "./Brand";
import { IconCheck, IconPackage } from "./Icons";

type Order = {
  code: string; customerFirstName: string; deliveryMode: "pickup" | "delivery"; locality: string | null; addressMasked: string | null;
  paymentMethod: string; status: string; subtotalCop: number; deliveryCostCop: number | null; isDemo: boolean; createdAt: string;
  items: { productId: string; name: string; unitPriceCop: number; quantity: number; image: string | null }[];
};

export function OrderLookup() {
  const sp = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true); setError(null); setOrder(null);
    try {
      const r = await fetch(`/api/orders?code=${encodeURIComponent(String(fd.get("code")))}&phone=${encodeURIComponent(String(fd.get("phone")))}`);
      const d = await r.json();
      if (!r.ok) setError(d.message ?? "No encontramos el pedido.");
      else setOrder(d.order);
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally { setLoading(false); }
  }

  const stepIndex = order ? (order.status === "listo_para_recoger" ? 2 : STATUS_STEPS.findIndex((s) => s.id === order.status)) : -1;

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={onSubmit} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="code">Código del pedido</label>
          <input id="code" name="code" defaultValue={sp.get("code") ?? ""} placeholder="JC-XXXXXX" required className="input uppercase" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Celular registrado</label>
          <input id="phone" name="phone" type="tel" inputMode="numeric" placeholder="3001234567" required className="input" />
        </div>
        <button disabled={loading} className="btn-primary py-3">{loading ? "Buscando…" : "Consultar"}</button>
        <p className="text-xs text-muted sm:col-span-3">¿Quieres probar? Usa el pedido de prueba <strong>JC-DEMO01</strong> o <strong>JC-DEMO02</strong> con el celular <strong>3000000000</strong>.</p>
      </form>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {order && (
        <article className="card overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-6">
            <div>
              <p className="text-xs text-muted">Pedido de {order.customerFirstName}</p>
              <h2 className="font-display text-2xl tracking-wider">{order.code}</h2>
              <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" })}</p>
            </div>
            {order.isDemo && <DemoBadge label="Pedido de prueba" />}
          </header>

          <ol className="grid gap-3 p-6 sm:grid-cols-4" aria-label="Estado del pedido">
            {order.status === "cancelado" ? (
              <li className="text-sm font-semibold text-rose-600 sm:col-span-4">Pedido cancelado</li>
            ) : (
              STATUS_STEPS.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2 sm:flex-col sm:text-center">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${i <= stepIndex ? "bg-electric-500 text-white" : "bg-surface text-muted"}`}>{i < stepIndex ? <IconCheck size={18} /> : <IconPackage size={18} />}</span>
                  <span className={`text-xs ${i <= stepIndex ? "font-semibold text-ink" : "text-muted"}`} aria-current={i === stepIndex ? "step" : undefined}>{s.label}</span>
                </li>
              ))
            )}
          </ol>

          <div className="grid gap-6 border-t border-line p-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold">Productos</h3>
              <ul className="space-y-3">
                {order.items.map((it) => (
                  <li key={it.productId} className="flex items-center gap-3 text-sm">
                    {it.image && <Image src={it.image} alt="" width={44} height={44} className="h-11 w-11 rounded-lg border border-line object-contain" />}
                    <span className="flex-1">{it.name} <span className="text-muted">x{it.quantity}</span></span>
                    <span>{formatCOP(it.unitPriceCop * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <dl className="space-y-2 text-sm">
              <h3 className="mb-3 text-sm font-semibold">Entrega y pago</h3>
              <div className="flex justify-between gap-4"><dt className="text-muted">Modalidad</dt><dd>{order.deliveryMode === "pickup" ? "Recogida en tienda" : `Domicilio · ${order.locality ?? ""}`}</dd></div>
              {order.addressMasked && <div className="flex justify-between gap-4"><dt className="text-muted">Dirección</dt><dd className="text-right">{order.addressMasked}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-muted">Medio de pago</dt><dd>{PAYMENT_LABEL[order.paymentMethod]}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Subtotal</dt><dd>{formatCOP(order.subtotalCop)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Domicilio</dt><dd>{order.deliveryMode === "pickup" ? "No aplica" : order.deliveryCostCop != null ? formatCOP(order.deliveryCostCop) : "Por confirmar"}</dd></div>
            </dl>
          </div>
        </article>
      )}
    </div>
  );
}
