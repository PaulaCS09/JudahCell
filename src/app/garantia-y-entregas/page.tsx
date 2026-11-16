import type { Metadata } from "next";
import { AskAdvisorButton } from "@/components/HeroAsk";
import { IconCheck, IconInfo, IconShield, IconStore, IconTruck, IconWallet } from "@/components/Icons";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Garantía, entregas y pagos" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await getSettings();
  return (
    <div>
      <section className="hero-glow text-white">
        <div className="container-x py-14">
          <h1 className="text-3xl font-medium sm:text-4xl">Compra con confianza</h1>
          <p className="mt-3 max-w-2xl text-white/75">Estas son las condiciones conocidas de JUDAH CELL. Lo que aún no está definido lo indicamos como “por confirmar”: preferimos decírtelo a inventarlo.</p>
        </div>
      </section>

      <div className="container-x grid gap-6 py-12 lg:grid-cols-3">
        <section id="garantia" className="card scroll-mt-28 p-6 lg:col-span-3">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-electric-500/10 text-electric-600"><IconShield size={26} /></span><h2 className="text-2xl font-medium">Garantía de {s.warranty.months} meses</h2></div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            <li className="flex gap-2"><IconCheck className="mt-0.5 shrink-0 text-emerald-600" />{s.warranty.coverage}</li>
            {s.warranty.requirements.map((r) => <li key={r} className="flex gap-2"><IconCheck className="mt-0.5 shrink-0 text-emerald-600" />Requisito: {r}</li>)}
            <li className="flex gap-2"><IconCheck className="mt-0.5 shrink-0 text-emerald-600" />{s.warranty.resolution}</li>
            {s.warranty.notes.map((n) => <li key={n} className="flex gap-2"><IconInfo className="mt-0.5 shrink-0 text-amber-600" />{n}</li>)}
          </ul>
          <p className="mt-5 text-sm text-muted">La garantía de accesorios se confirma producto por producto. El procedimiento detallado para hacer efectiva la garantía será publicado por JUDAH CELL.</p>
        </section>

        <section id="entregas" className="card scroll-mt-28 p-6 lg:col-span-2">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-electric-500/10 text-electric-600"><IconTruck size={26} /></span><h2 className="text-2xl font-medium">Entregas</h2></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-surface p-4">
              <p className="flex items-center gap-2 font-semibold"><IconStore size={18} />Recogida en tienda</p>
              <p className="mt-1 text-sm text-muted">{s.delivery.pickup.detail}</p>
              <p className="mt-2 text-sm">Dirección: <strong>{s.store_address ?? "por confirmar"}</strong></p>
              <p className="text-sm">Horario: <strong>{s.store_hours ?? "por confirmar"}</strong></p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="flex items-center gap-2 font-semibold"><IconTruck size={18} />Domicilio en {s.delivery.home.city}</p>
              <p className="mt-1 text-sm text-muted">{s.delivery.home.detail}</p>
              <p className="mt-2 text-sm">Tarifas: <strong>{s.delivery.rates ? "según localidad (ver checkout)" : "un asesor te confirma el costo según tu dirección"}</strong></p>
              <p className="text-sm">Tiempos: <strong>{s.delivery.estimated_times ?? "se confirman al aprobar el pedido"}</strong></p>
            </div>
          </div>
        </section>

        <section id="pagos" className="card scroll-mt-28 p-6">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-electric-500/10 text-electric-600"><IconWallet size={26} /></span><h2 className="text-2xl font-medium">Medios de pago</h2></div>
          <ul className="mt-5 space-y-3">
            {s.payment_methods.map((p) => <li key={p.id}><p className="font-semibold">{p.name}</p><p className="text-sm text-muted">{p.detail}</p></li>)}
          </ul>
        </section>

        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-navy-900 p-6 text-white sm:flex-row sm:items-center lg:col-span-3">
          <p>¿Tienes otra duda sobre tu compra? El Asesor JUDAH te responde con la información oficial.</p>
          <AskAdvisorButton label="Preguntar al asesor" className="btn-cyan" />
        </div>
      </div>
    </div>
  );
}
