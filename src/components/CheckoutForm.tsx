"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BOGOTA_LOCALITIES, PAYMENT_LABEL } from "@/lib/bogota";
import type { StoreSettings } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { IconCheck, IconStore, IconTruck } from "./Icons";
import { useStore } from "./providers/StoreProvider";

type Props = { payments: StoreSettings["payment_methods"]; delivery: StoreSettings["delivery"]; storeAddress: string | null };
type Done = { code: string; subtotal: number; deliveryCost: number | null };

export function CheckoutForm({ payments, delivery, storeAddress }: Props) {
  const { cart, clearCart } = useStore();
  const [mode, setMode] = useState<"pickup" | "delivery">("pickup");
  const [payment, setPayment] = useState("");
  const [locality, setLocality] = useState("");
  const [quote, setQuote] = useState<{ costCop: number | null; message?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const subtotal = cart.reduce((s, l) => s + l.priceCop * l.quantity, 0);

  async function checkQuote(loc: string) {
    setLocality(loc);
    setQuote(null);
    if (!loc) return;
    const r = await fetch("/api/delivery-quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locality: loc }) });
    if (r.ok) setQuote(await r.json());
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      customerName: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      deliveryMode: mode,
      address: mode === "delivery" ? String(fd.get("address") ?? "") : undefined,
      locality: mode === "delivery" ? locality : undefined,
      paymentMethod: payment,
      notes: String(fd.get("notes") ?? ""),
      acceptsDataPolicy: fd.get("policy") === "on",
      items: cart.map((l) => ({ productId: l.id, quantity: l.quantity })),
    };
    const errs: Record<string, string> = {};
    if (!payment) errs.paymentMethod = "Elige un medio de pago";
    if (mode === "delivery" && !locality) errs.locality = "Elige tu localidad";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true); setFormError(null);
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErrors(d.fieldErrors ?? {});
        setFormError(d.message ?? "No pudimos registrar el pedido.");
        return;
      }
      setDone(d);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("Sin conexión. Revisa tu internet e intenta de nuevo.");
    } finally { setSending(false); }
  }

  if (done)
    return (
      <div className="container-x max-w-2xl py-14">
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><IconCheck size={32} /></span>
          <h1 className="mt-5 text-3xl font-medium">¡Recibimos tu solicitud de compra!</h1>
          <p className="mt-2 text-muted">Código de pedido</p>
          <p className="font-display text-3xl tracking-widest text-electric-600">{done.code}</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted">
            Un asesor de JUDAH CELL te contactará al celular que registraste para confirmar disponibilidad, {done.deliveryCost === null ? "el costo del domicilio, " : ""}y los detalles del pago. <strong className="text-ink">No se ha realizado ningún cobro.</strong>
          </p>
          <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">Prototipo: este pedido es demostrativo.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/pedidos?code=${done.code}`} className="btn-primary">Ver estado del pedido</Link>
            <Link href="/" className="btn-outline">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );

  if (!cart.length)
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-medium">No hay productos para comprar</h1>
        <Link href="/catalogo" className="btn-primary mt-6">Ir al catálogo</Link>
      </div>
    );

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-rose-600" role="alert">{errors[k]}</p>;

  return (
    <div className="container-x py-8 sm:py-12">
      <h1 className="text-3xl font-medium sm:text-4xl">Finalizar compra</h1>
      <p className="mt-2 text-sm text-muted">Registra tu solicitud y un asesor la confirma contigo. No pedimos datos bancarios ni se hacen cobros en línea.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <fieldset className="card min-w-0 space-y-4 p-6">
            <legend className="sr-only">1. Tus datos</legend><h2 aria-hidden="true" className="font-display text-lg">1. Tus datos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="name">Nombre completo *</label>
                <input id="name" name="name" autoComplete="name" required maxLength={80} className="input" aria-invalid={!!errors.customerName} />
                {err("customerName")}
              </div>
              <div>
                <label className="label" htmlFor="phone">Celular *</label>
                <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="3001234567" required className="input" aria-invalid={!!errors.phone} />
                {err("phone")}
              </div>
              <div>
                <label className="label" htmlFor="email">Correo <span className="font-normal text-muted">(opcional)</span></label>
                <input id="email" name="email" type="email" autoComplete="email" className="input" aria-invalid={!!errors.email} />
                {err("email")}
              </div>
            </div>
          </fieldset>

          <fieldset className="card min-w-0 space-y-4 p-6">
            <legend className="sr-only">2. Entrega</legend><h2 aria-hidden="true" className="font-display text-lg">2. Entrega</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {delivery.pickup.enabled && (
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${mode === "pickup" ? "border-electric-500 bg-electric-500/5" : "border-line"}`}>
                  <input type="radio" name="mode" checked={mode === "pickup"} onChange={() => setMode("pickup")} className="mt-1 accent-electric-500" />
                  <span><span className="flex items-center gap-2 font-semibold"><IconStore size={18} />Recoger en tienda</span><span className="mt-1 block text-xs text-muted">Sin costo. {storeAddress ?? "Dirección del punto físico: pendiente de configurar."}</span></span>
                </label>
              )}
              {delivery.home.enabled && (
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${mode === "delivery" ? "border-electric-500 bg-electric-500/5" : "border-line"}`}>
                  <input type="radio" name="mode" checked={mode === "delivery"} onChange={() => setMode("delivery")} className="mt-1 accent-electric-500" />
                  <span><span className="flex items-center gap-2 font-semibold"><IconTruck size={18} />Domicilio en Bogotá</span><span className="mt-1 block text-xs text-muted">Costo adicional según tu ubicación.</span></span>
                </label>
              )}
            </div>
            {mode === "delivery" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="locality">Localidad *</label>
                  <select id="locality" value={locality} onChange={(e) => checkQuote(e.target.value)} className="input" aria-invalid={!!errors.locality}>
                    <option value="">Elige tu localidad</option>
                    {BOGOTA_LOCALITIES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                  {err("locality")}
                </div>
                <div>
                  <label className="label" htmlFor="address">Dirección *</label>
                  <input id="address" name="address" autoComplete="street-address" placeholder="Calle 00 # 00-00, apto…" maxLength={160} className="input" aria-invalid={!!errors.address} />
                  {err("address")}
                </div>
                {quote && (
                  <p className="rounded-xl bg-surface p-3 text-sm sm:col-span-2">
                    {quote.costCop != null ? <>Costo de domicilio: <strong>{formatCOP(quote.costCop)}</strong></> : <>{quote.message}</>}
                  </p>
                )}
              </div>
            )}
          </fieldset>

          <fieldset className="card min-w-0 space-y-4 p-6">
            <legend className="sr-only">3. Medio de pago</legend><h2 aria-hidden="true" className="font-display text-lg">3. Medio de pago</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {payments.map((p) => (
                <label key={p.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${payment === p.id ? "border-electric-500 bg-electric-500/5" : "border-line"}`}>
                  <input type="radio" name="payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} className="mt-1 accent-electric-500" />
                  <span><span className="font-semibold">{p.name}</span><span className="mt-1 block text-xs text-muted">{p.detail}</span></span>
                </label>
              ))}
            </div>
            {err("paymentMethod")}
          </fieldset>

          <div className="card space-y-4 p-6">
            <div>
              <label className="label" htmlFor="notes">Notas para el asesor <span className="font-normal text-muted">(opcional)</span></label>
              <textarea id="notes" name="notes" rows={2} maxLength={300} className="input" placeholder="Ej: color preferido, horario para llamarte…" />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="policy" required className="mt-1 h-4 w-4 accent-electric-500" />
              <span>Autorizo a JUDAH CELL a usar mis datos solo para gestionar este pedido y contactarme sobre él (Ley 1581 de 2012).</span>
            </label>
            {err("acceptsDataPolicy")}
          </div>
        </div>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg">Tu pedido</h2>
          <ul className="space-y-3">
            {cart.map((l) => (
              <li key={l.id} className="flex items-center gap-3 text-sm">
                <Image src={l.image} alt="" width={48} height={48} className="h-12 w-12 rounded-lg border border-line object-contain" />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{l.name}</span><span className="text-muted">x{l.quantity}</span></span>
                <span className="font-medium">{formatCOP(l.priceCop * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatCOP(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd>{mode === "pickup" ? "Gratis (recogida)" : quote?.costCop != null ? formatCOP(quote.costCop) : "Por confirmar"}</dd></div>
            {payment && <div className="flex justify-between"><dt className="text-muted">Pago</dt><dd>{PAYMENT_LABEL[payment]}</dd></div>}
          </dl>
          <div className="flex justify-between border-t border-line pt-4 text-lg font-bold"><span>Total</span><span>{formatCOP(subtotal + (mode === "delivery" && quote?.costCop ? quote.costCop : 0))}{mode === "delivery" && quote?.costCop == null && <span className="block text-right text-xs font-normal text-muted">+ domicilio</span>}</span></div>
          {formError && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{formError}</p>}
          <button disabled={sending} className="btn-primary w-full py-3.5">{sending ? "Enviando…" : "Confirmar solicitud de compra"}</button>
          <p className="text-center text-xs text-muted">No se realizará ningún cobro ahora.</p>
        </aside>
      </form>
    </div>
  );
}
